"""Plotting functions for session analysis visualization."""

from typing import Any, Dict, Optional

import matplotlib.pyplot as plt
import numpy as np


TEACHER_COLOR = "#3266AD"
STUDENT_COLOR = "#3CA877"
ACCENT_COLOR = "#D8A31A"
ERROR_COLOR = "#E24B4A"
BG_COLOR = "#0E1117"
FG_COLOR = "#CCCCCC"
GRID_COLOR = "#333333"


def _apply_dark_axes(ax: plt.Axes, title: str, xlabel: Optional[str] = None, ylabel: Optional[str] = None) -> None:
    fig = ax.figure
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_title(title, color="white", fontsize=13)
    if xlabel:
        ax.set_xlabel(xlabel, color=FG_COLOR)
    if ylabel:
        ax.set_ylabel(ylabel, color=FG_COLOR)
    ax.tick_params(colors="#AAAAAA")
    for spine in ax.spines.values():
        spine.set_edgecolor(GRID_COLOR)


def _save_or_show(fig: plt.Figure, save_path: Optional[str] = None) -> plt.Figure:
    plt.tight_layout()
    if save_path:
        fig.savefig(save_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    return fig


def plot_pace_proxy(metrics: Dict[str, Any], save_path: Optional[str] = None) -> plt.Figure:
    rows = metrics.get("speaking_pace", {}).get("per_segment", [])
    if not rows:
        raise ValueError("No speaking pace data available to plot")

    x = np.arange(len(rows))
    y = [row["pace_proxy"] for row in rows]
    colors = [TEACHER_COLOR if row["role"] == "teacher" else STUDENT_COLOR for row in rows]
    labels = [f'{row["role"][0].upper()}@{row["start"]:.1f}s' for row in rows]

    fig, ax = plt.subplots(figsize=(12, 4.5))
    ax.bar(x, y, color=colors, alpha=0.9)
    _apply_dark_axes(ax, "Speaking Pace Proxy by Segment", ylabel="Pace proxy")
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=55, ha="right", fontsize=8, color="#AAAAAA")
    ax.axhline(3.0, color="#888888", linestyle="--", linewidth=0.8)
    ax.axhline(5.5, color=ERROR_COLOR, linestyle="--", linewidth=0.8)
    return _save_or_show(fig, save_path)


def plot_turn_timeline(metrics: Dict[str, Any], save_path: Optional[str] = None) -> plt.Figure:
    turns = metrics.get("turn_taking", {}).get("merged_turns", [])
    if not turns:
        raise ValueError("No turn-taking data available to plot")

    fig, ax = plt.subplots(figsize=(13, 2.8))
    for turn in turns:
        color = TEACHER_COLOR if turn["role"] == "teacher" else STUDENT_COLOR
        y = 1 if turn["role"] == "teacher" else 0
        ax.broken_barh([(turn["start"], turn["duration"])], (y - 0.35, 0.7), facecolors=color, alpha=0.9)

    _apply_dark_axes(ax, "Turn-Taking Timeline", xlabel="Time (s)")
    ax.set_yticks([0, 1])
    ax.set_yticklabels(["Student", "Teacher"], color=FG_COLOR)
    return _save_or_show(fig, save_path)


def plot_energy_profile(metrics: Dict[str, Any], save_path: Optional[str] = None) -> plt.Figure:
    rows = metrics.get("energy_loudness", {}).get("per_segment", [])
    if not rows:
        raise ValueError("No energy data available to plot")

    teacher_rows = [row for row in rows if row["role"] == "teacher"]
    student_rows = [row for row in rows if row["role"] == "student"]

    fig, ax = plt.subplots(figsize=(12, 4.5))
    if teacher_rows:
        ax.plot([row["start"] for row in teacher_rows], [row["dbfs"] for row in teacher_rows], marker="o", color=TEACHER_COLOR, label="Teacher")
    if student_rows:
        ax.plot([row["start"] for row in student_rows], [row["dbfs"] for row in student_rows], marker="o", color=STUDENT_COLOR, label="Students")

    _apply_dark_axes(ax, "Energy / Loudness Profile", xlabel="Segment start (s)", ylabel="dBFS")
    ax.legend(facecolor="#1A1A2E", edgecolor=GRID_COLOR, labelcolor="white")
    return _save_or_show(fig, save_path)


def plot_session_phases(metrics: Dict[str, Any], save_path: Optional[str] = None) -> plt.Figure:
    phases = metrics.get("session_segmentation", {}).get("phases", [])
    if not phases:
        raise ValueError("No session phase data available to plot")

    phase_colors = {
        "instruction": TEACHER_COLOR,
        "student_activity": STUDENT_COLOR,
        "q_and_a": ACCENT_COLOR,
        "transition": "#8A8F98",
        "mixed": "#9B59B6",
    }

    fig, ax = plt.subplots(figsize=(13, 2.8))
    for phase in phases:
        color = phase_colors.get(phase["label"], "#888888")
        ax.broken_barh([(phase["start"], phase["duration"])], (0.2, 0.6), facecolors=color, alpha=0.92)
        ax.text(
            phase["start"] + phase["duration"] / 2,
            0.5,
            phase["label"],
            ha="center",
            va="center",
            color="white",
            fontsize=8,
        )

    _apply_dark_axes(ax, "Session Segmentation", xlabel="Time (s)")
    ax.set_ylim(0, 1)
    ax.set_yticks([])
    return _save_or_show(fig, save_path)


def plot_engagement_breakdown(metrics: Dict[str, Any], save_path: Optional[str] = None) -> plt.Figure:
    engagement = metrics.get("engagement_score", {})
    components = engagement.get("components", {})
    if not components:
        raise ValueError("No engagement data available to plot")

    labels = list(components.keys())
    values = [components[label] for label in labels]
    colors = [TEACHER_COLOR, STUDENT_COLOR, ACCENT_COLOR, ERROR_COLOR, "#5DADE2", "#AAB7B8"][: len(labels)]

    fig, ax = plt.subplots(figsize=(10, 4.5))
    ax.barh(labels, values, color=colors, alpha=0.92)
    _apply_dark_axes(ax, f'Engagement Score Breakdown ({engagement.get("score", 0)}/100)', xlabel="Score")
    ax.set_xlim(0, 100)
    ax.tick_params(axis="y", colors=FG_COLOR)
    return _save_or_show(fig, save_path)


def plot_all(metrics: Dict[str, Any], output_dir: Optional[str] = None) -> Dict[str, plt.Figure]:
    save = (lambda name: None) if not output_dir else (lambda name: f"{output_dir}/{name}")
    return {
        "pace_proxy": plot_pace_proxy(metrics, save("pace_proxy.png")),
        "turn_timeline": plot_turn_timeline(metrics, save("turn_timeline.png")),
        "energy_profile": plot_energy_profile(metrics, save("energy_profile.png")),
        "session_phases": plot_session_phases(metrics, save("session_phases.png")),
        "engagement_breakdown": plot_engagement_breakdown(metrics, save("engagement_breakdown.png")),
    }
