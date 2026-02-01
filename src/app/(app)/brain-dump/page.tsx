"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { GlassCard } from "@/components/ui/glass-card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { PageTransition } from "@/components/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/stagger";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { useAxisActions, useAxisStore } from "@/lib/store";
import { createId } from "@/lib/utils";
import type { BrainDumpBoardItem } from "@/lib/models";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const GRID_SIZE = 24;
const DOODLE_WIDTH = 2000;
const DOODLE_HEIGHT = 1400;

const NOTE_COLORS: Array<BrainDumpBoardItem["color"]> = [
  "lime",
  "amber",
  "blue",
  "rose",
  "slate",
];

export default function BrainDumpPage() {
  const { mode, brainDumpByMode } = useAxisStore((state) => state);
  const actions = useAxisActions();
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [panning, setPanning] = useState<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [draggingGroup, setDraggingGroup] = useState<{
    ids: string[];
    startPoint: { x: number; y: number };
    positions: Record<string, { x: number; y: number }>;
  } | null>(null);
  const [resizing, setResizing] = useState<{
    id: string;
    startPoint: { x: number; y: number };
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteColor, setNoteColor] = useState<BrainDumpBoardItem["color"]>("lime");
  const [noteSize, setNoteSize] = useState<"small" | "medium" | "large">(
    "medium",
  );
  const [drawMode, setDrawMode] = useState(false);
  const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const board = brainDumpByMode[mode];
  const items = board.items;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const maxZ = useMemo(
    () => items.reduce((acc, item) => Math.max(acc, item.zIndex ?? 0), 0),
    [items],
  );

  const screenToBoard = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }
    const x = (clientX - rect.left - board.camera.x) / board.camera.zoom;
    const y = (clientY - rect.top - board.camera.y) / board.camera.zoom;
    return { x, y };
  };


  const addNote = (text = "New note") => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : 0;
    const centerY = rect ? rect.height / 2 : 0;
    const boardPoint = screenToBoard(centerX, centerY);
    const sizeMap = {
      small: { width: 200, height: 120 },
      medium: { width: 240, height: 160 },
      large: { width: 320, height: 220 },
    };
    const item: BrainDumpBoardItem = {
      id: createId(),
      type: "note",
      text,
      color: noteColor,
      x: boardPoint.x,
      y: boardPoint.y,
      width: sizeMap[noteSize].width,
      height: sizeMap[noteSize].height,
      zIndex: maxZ + 1,
      createdAt: new Date().toISOString(),
    };
    actions.addBrainDumpBoardItem(mode, item);
  };

  const addImage = (dataUrl: string) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : 0;
    const centerY = rect ? rect.height / 2 : 0;
    const boardPoint = screenToBoard(centerX, centerY);
    const item: BrainDumpBoardItem = {
      id: createId(),
      type: "image",
      imageDataUrl: dataUrl,
      color: "slate",
      x: boardPoint.x,
      y: boardPoint.y,
      width: 320,
      height: 200,
      zIndex: maxZ + 1,
      createdAt: new Date().toISOString(),
    };
    actions.addBrainDumpBoardItem(mode, item);
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (!event.clipboardData) {
        return;
      }
      const items = Array.from(event.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (!file) {
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            addImage(reader.result);
          }
        };
        reader.readAsDataURL(file);
        event.preventDefault();
        return;
      }
      const text = event.clipboardData.getData("text/plain");
      if (text.trim()) {
        addNote(text.trim());
        event.preventDefault();
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  useEffect(() => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = DOODLE_WIDTH;
    canvas.height = DOODLE_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#76ff2b";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (board.doodleDataUrl) {
      const image = new Image();
      image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = board.doodleDataUrl;
    }
  }, [board.doodleDataUrl]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const nextZoom = clamp(board.camera.zoom * zoomFactor, 0.5, 2.2);
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const worldX = (pointerX - board.camera.x) / board.camera.zoom;
    const worldY = (pointerY - board.camera.y) / board.camera.zoom;
    const nextX = pointerX - worldX * nextZoom;
    const nextY = pointerY - worldY * nextZoom;
    actions.setBrainDumpCamera(mode, { x: nextX, y: nextY, zoom: nextZoom });
  };

  const snapValue = (value: number) =>
    board.snapToGrid
      ? Math.round(value / board.gridSize) * board.gridSize
      : value;

  const applySnapToSelection = (ids: string[]) => {
    if (!board.snapToGrid) {
      return;
    }
    ids.forEach((id) => {
      const item = items.find((entry) => entry.id === id);
      if (!item) {
        return;
      }
      actions.updateBrainDumpBoardItem(mode, id, {
        x: snapValue(item.x),
        y: snapValue(item.y),
        width: snapValue(item.width),
        height: snapValue(item.height),
      });
    });
  };

  const startDoodle = (clientX: number, clientY: number) => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const point = screenToBoard(clientX, clientY);
    drawing.current = true;
    lastPoint.current = { x: point.x, y: point.y };
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const drawDoodle = (clientX: number, clientY: number) => {
    if (!drawing.current) {
      return;
    }
    const canvas = doodleCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const point = screenToBoard(clientX, clientY);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPoint.current = { x: point.x, y: point.y };
  };

  const endDoodle = () => {
    if (!drawing.current) {
      return;
    }
    drawing.current = false;
    const canvas = doodleCanvasRef.current;
    if (!canvas) {
      return;
    }
    actions.setBrainDumpDoodle(mode, canvas.toDataURL("image/png"));
  };

  const fitBoardToView = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || items.length === 0) {
      return board.camera;
    }
    const padding = 120;
    const bounds = items.reduce(
      (acc, item) => ({
        minX: Math.min(acc.minX, item.x),
        minY: Math.min(acc.minY, item.y),
        maxX: Math.max(acc.maxX, item.x + item.width),
        maxY: Math.max(acc.maxY, item.y + item.height),
      }),
      {
        minX: items[0].x,
        minY: items[0].y,
        maxX: items[0].x + items[0].width,
        maxY: items[0].y + items[0].height,
      },
    );
    const width = bounds.maxX - bounds.minX + padding * 2;
    const height = bounds.maxY - bounds.minY + padding * 2;
    const zoom = clamp(Math.min(rect.width / width, rect.height / height), 0.4, 1.2);
    const centerX = bounds.minX + (bounds.maxX - bounds.minX) / 2;
    const centerY = bounds.minY + (bounds.maxY - bounds.minY) / 2;
    return {
      x: rect.width / 2 - centerX * zoom,
      y: rect.height / 2 - centerY * zoom,
      zoom,
    };
  };

  const exportPng = async () => {
    if (!containerRef.current) {
      return;
    }
    const originalCamera = board.camera;
    const nextCamera = fitBoardToView();
    actions.setBrainDumpCamera(mode, nextCamera);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: "#07080a",
      scale: 2,
    });
    actions.setBrainDumpCamera(mode, originalCamera);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `axis-brain-dump-${mode}.png`;
    link.click();
  };

  const exportPdf = async () => {
    if (!containerRef.current) {
      return;
    }
    const originalCamera = board.camera;
    const nextCamera = fitBoardToView();
    actions.setBrainDumpCamera(mode, nextCamera);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: "#07080a",
      scale: 2,
    });
    actions.setBrainDumpCamera(mode, originalCamera);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "pt", [canvas.width, canvas.height]);
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`axis-brain-dump-${mode}.pdf`);
  };

  return (
    <>
      <PageTransition>
        <StaggerContainer>
          <div className="flex flex-col gap-6">
          <StaggerItem>
            <ModeToggle value={mode} onChange={actions.setMode} />
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                    Brain Dump Board
                  </p>
                  <p className="text-sm text-[var(--text-1)]">
                    Paste screenshots or text, drag items, and zoom in/out.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SecondaryButton
                    type="button"
                    className="w-auto px-4 py-2"
                    onClick={() => setNoteModalOpen(true)}
                  >
                    Add Note
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    className="w-auto px-4 py-2"
                    onClick={() =>
                      actions.setBrainDumpGrid(mode, {
                        snapToGrid: !board.snapToGrid,
                      })
                    }
                  >
                    Snap {board.snapToGrid ? "On" : "Off"}
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    className="w-auto px-4 py-2"
                    onClick={() => setDrawMode((prev) => !prev)}
                  >
                    Doodle {drawMode ? "On" : "Off"}
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    className="w-auto px-4 py-2"
                    onClick={() => actions.setBrainDumpDoodle(mode, null)}
                  >
                    Clear Doodle
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    className="w-auto px-4 py-2"
                    onClick={() =>
                      actions.setBrainDumpCamera(mode, { x: 0, y: 0, zoom: 1 })
                    }
                  >
                    Reset View
                  </SecondaryButton>
                  <PrimaryButton
                    type="button"
                    className="w-auto px-4 py-2"
                    onClick={() =>
                      actions.setBrainDumpCamera(mode, {
                        x: board.camera.x,
                        y: board.camera.y,
                        zoom: clamp(board.camera.zoom + 0.1, 0.5, 2.2),
                      })
                    }
                  >
                    Zoom In
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    className="w-auto px-4 py-2"
                    onClick={() =>
                      actions.setBrainDumpCamera(mode, {
                        x: board.camera.x,
                        y: board.camera.y,
                        zoom: clamp(board.camera.zoom - 0.1, 0.5, 2.2),
                      })
                    }
                  >
                    Zoom Out
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    className="w-auto px-4 py-2"
                    onClick={exportPng}
                  >
                    Export PNG
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    className="w-auto px-4 py-2"
                    onClick={exportPdf}
                  >
                    Export PDF
                  </SecondaryButton>
                </div>
              </div>
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <div
              ref={containerRef}
              onWheel={handleWheel}
              onPointerDown={(event) => {
                if (drawMode) {
                  startDoodle(event.clientX, event.clientY);
                  return;
                }
                const target = event.target as HTMLElement;
                if (
                  target.dataset.handle === "resize" ||
                  target.closest('[data-item="true"]')
                ) {
                  return;
                }
                setSelectedIds([]);
                setPanning({
                  startX: event.clientX,
                  startY: event.clientY,
                  originX: board.camera.x,
                  originY: board.camera.y,
                });
              }}
              onPointerMove={(event) => {
                if (drawMode) {
                  drawDoodle(event.clientX, event.clientY);
                  return;
                }
                if (resizing) {
                  const point = screenToBoard(event.clientX, event.clientY);
                  const nextWidth = clamp(
                    resizing.startWidth + (point.x - resizing.startPoint.x),
                    140,
                    620,
                  );
                  const nextHeight = clamp(
                    resizing.startHeight + (point.y - resizing.startPoint.y),
                    120,
                    620,
                  );
                  actions.updateBrainDumpBoardItem(mode, resizing.id, {
                    width: snapValue(nextWidth),
                    height: snapValue(nextHeight),
                  });
                } else if (draggingGroup) {
                  const point = screenToBoard(event.clientX, event.clientY);
                  const dx = point.x - draggingGroup.startPoint.x;
                  const dy = point.y - draggingGroup.startPoint.y;
                  draggingGroup.ids.forEach((id) => {
                    const start = draggingGroup.positions[id];
                    actions.updateBrainDumpBoardItem(mode, id, {
                      x: start.x + dx,
                      y: start.y + dy,
                    });
                  });
                } else if (panning) {
                  const dx = event.clientX - panning.startX;
                  const dy = event.clientY - panning.startY;
                  actions.setBrainDumpCamera(mode, {
                    x: panning.originX + dx,
                    y: panning.originY + dy,
                    zoom: board.camera.zoom,
                  });
                }
              }}
              onPointerUp={() => {
                if (drawMode) {
                  endDoodle();
                  return;
                }
                if (draggingGroup) {
                  applySnapToSelection(draggingGroup.ids);
                }
                setPanning(null);
                setDraggingGroup(null);
                setResizing(null);
              }}
              onPointerLeave={() => {
                if (drawMode) {
                  endDoodle();
                  return;
                }
                if (draggingGroup) {
                  applySnapToSelection(draggingGroup.ids);
                }
                setPanning(null);
                setDraggingGroup(null);
                setResizing(null);
              }}
              className={`glass-panel relative h-[70vh] w-full overflow-hidden rounded-[var(--r-lg)] sm:h-[72vh] lg:h-[75vh] xl:h-[78vh] ${
                board.snapToGrid ? "brain-grid" : ""
              }`}
            >
              <div ref={boardSurfaceRef} className="absolute inset-0">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 20% 20%, rgba(118,255,43,0.08), transparent 40%), radial-gradient(circle at 80% 10%, rgba(118,255,43,0.08), transparent 45%)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${board.camera.x}px, ${board.camera.y}px) scale(${board.camera.zoom})`,
                    transformOrigin: "0 0",
                  }}
                >
                  <canvas
                    ref={doodleCanvasRef}
                    className="absolute left-0 top-0"
                    style={{ width: DOODLE_WIDTH, height: DOODLE_HEIGHT }}
                  />
                  <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const isSelected = selectedSet.has(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        data-item="true"
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                        style={{
                          position: "absolute",
                          left: item.x,
                          top: item.y,
                          width: item.width,
                          height: item.height,
                          zIndex: item.zIndex,
                        }}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          const additive = event.shiftKey || event.metaKey || event.ctrlKey;
                          const nextSelected = additive
                            ? selectedSet.has(item.id)
                              ? selectedIds.filter((entry) => entry !== item.id)
                              : [...selectedIds, item.id]
                            : [item.id];
                          setSelectedIds(nextSelected);
                          const point = screenToBoard(event.clientX, event.clientY);
                          const ids = nextSelected.length > 0 ? nextSelected : [item.id];
                          const positions = ids.reduce<Record<string, { x: number; y: number }>>(
                            (acc, id) => {
                              const entry = items.find((node) => node.id === id);
                              if (entry) {
                                acc[id] = { x: entry.x, y: entry.y };
                              }
                              return acc;
                            },
                            {},
                          );
                          setDraggingGroup({
                            ids,
                            startPoint: point,
                            positions,
                          });
                          actions.updateBrainDumpBoardItem(mode, item.id, {
                            zIndex: maxZ + 1,
                          });
                        }}
                        className="group relative"
                      >
                        <div
                          className={`glass-panel-opaque flex h-full w-full flex-col gap-2 rounded-[var(--r-md)] p-3 ${
                            isSelected ? "ring-2 ring-[var(--acc-0)]" : ""
                          } ${item.type === "note" ? `note-${item.color}` : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                              {item.type === "note" ? "Note" : "Image"}
                            </span>
                            <div className="flex items-center gap-2">
                              {item.type === "note" ? (
                                <div className="flex items-center gap-1">
                                  {NOTE_COLORS.map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      className={`h-3 w-3 rounded-full border border-[var(--border)] note-${color}`}
                                      onClick={() =>
                                        actions.updateBrainDumpBoardItem(mode, item.id, {
                                          color,
                                        })
                                      }
                                    />
                                  ))}
                                </div>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => actions.deleteBrainDumpBoardItem(mode, item.id)}
                                className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {item.type === "note" ? (
                            <textarea
                              value={item.text ?? ""}
                              onChange={(event) =>
                                actions.updateBrainDumpBoardItem(mode, item.id, {
                                  text: event.target.value,
                                })
                              }
                              className="h-full w-full resize-none bg-transparent text-sm text-[var(--text-0)] outline-none"
                            />
                          ) : (
                            <img
                              src={item.imageDataUrl}
                              alt="Brain dump item"
                              className="h-full w-full rounded-[var(--r-sm)] object-cover"
                            />
                          )}
                          <div
                            data-handle="resize"
                            onPointerDown={(event) => {
                              event.stopPropagation();
                              setResizing({
                                id: item.id,
                                startPoint: screenToBoard(event.clientX, event.clientY),
                                startWidth: item.width,
                                startHeight: item.height,
                              });
                            }}
                            className="absolute bottom-2 right-2 h-3 w-3 cursor-se-resize rounded-full border border-[var(--border)] bg-[var(--glass-2)]"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </StaggerItem>
          </div>
        </StaggerContainer>
      </PageTransition>

      <AnimatePresence>
        {noteModalOpen ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          >
            <GlassCard className="glass-panel-strong w-full max-w-md">
              <div className="flex items-center justify-between">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  New Note
                </p>
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(false)}
                  className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]"
                >
                  Close
                </button>
              </div>
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                rows={5}
                placeholder="Write the note..."
                className="mt-4 w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-3 py-3 text-sm text-[var(--text-0)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]"
              />
              <div className="mt-4 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                Color
              </div>
              <div className="mt-2 flex items-center gap-2">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-7 w-7 rounded-full border border-[var(--border)] note-${color} ${
                      noteColor === color ? "ring-2 ring-[var(--acc-0)]" : ""
                    }`}
                    onClick={() => setNoteColor(color)}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                Size
              </div>
              <div className="mt-2 flex items-center gap-2">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setNoteSize(size)}
                    className={`rounded-full border border-[var(--border)] px-3 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-1)] ${
                      noteSize === size ? "bg-[var(--glass-2)]" : ""
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SecondaryButton type="button" onClick={() => setNoteModalOpen(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    if (!noteText.trim()) {
                      return;
                    }
                    addNote(noteText.trim());
                    setNoteText("");
                    setNoteModalOpen(false);
                  }}
                >
                  Add Note
                </PrimaryButton>
              </div>
            </GlassCard>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

