---
name: iPAS AI Planner Study
description: A focused, source-linked study space for the iPAS AI Planner intermediate exams.
colors:
  paper: "#e8e8e8"
  ink: "#0f0f0f"
  muted-ink: "#686662"
  divider: "#a5a5a1"
  vermilion: "#a82828"
typography:
  display:
    fontFamily: "'Kaisei Decol', 'Noto Serif TC', serif"
    fontWeight: 600
    lineHeight: 1.1
  body:
    fontFamily: "'DM Sans', 'Noto Sans TC', sans-serif"
    fontSize: "16px"
    lineHeight: 1.6
  label:
    fontFamily: "'DM Mono', monospace"
    fontSize: "12px"
    letterSpacing: "0.08em"
rounded:
  square: "0"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
---

# Design System: iPAS AI Planner Study

## Overview

**Creative North Star: The Numbered Study Catalog**

The interface uses the familiar order of a study guide and marked-up workbook. Guide section numbers stay visible in the topic index; the active topic, its explanation, and its related practice occupy the reading column. On the home page, weak topics lead directly to focused practice. During a timed exam, the question and choices remain primary while the timer and question index stay easy to find.

The visual direction is quiet and editorial: gray newsprint, dark ink, thin rules, and a restrained vermilion mark for selection and action. The screen should feel like a well-kept exam workbook, with real study content and source labels instead of decorative dashboards.

**Key Characteristics:**
- Numbered guide sections make navigation traceable.
- Editorial rules and open space organize content instead of card-heavy surfaces.
- Vermilion is reserved for selection, emphasis, and primary actions.

## Colors

The palette pairs neutral gray paper and ink with one controlled red accent.

### Primary
- **Vermilion** (#a82828): Active topic marker, important links, and primary practice action.

### Neutral
- **Paper gray** (#e8e8e8): Main page canvas and selected text background.
- **Ink** (#0f0f0f): Main text, headers, and strong rules.
- **Muted ink** (#686662): Explanatory copy and supporting labels.
- **Divider gray** (#a5a5a1): Topic boundaries and understated rules.

## Typography

**Display Font:** Kaisei Decol with Noto Serif TC, serif fallback  
**Body Font:** DM Sans with Noto Sans TC, sans-serif fallback  
**Label/Mono Font:** DM Mono, monospace

**Character:** Headings carry a restrained editorial weight, while body text remains plain and readable. Monospaced labels are used for compact subject and section identifiers.

### Hierarchy
- **Display** (600, fluid 34–58px on home): Main page heading.
- **Headline** (600, 28px): Major section heading.
- **Title** (500, 20–24px): Topic and subject titles.
- **Body** (400, 13–18px): Explanations and supporting content.
- **Label** (400–500, 9–14px, tracked where useful): Subject codes, metadata, and section identifiers.

## Layout

Topic practice uses a two-column desktop layout: a syllabus index on the left and selected-topic content on the right, divided by a vertical rule. At narrower widths, the index and topic content reflow into a compact single-column reading order. The home page puts weak topics first and keeps full mock exams and recent attempts secondary. Timed exams prioritize the question and answer choices; the question index and timer remain available without taking over the reading area.

## Elevation & Depth

The study surfaces are primarily flat. Borders and whitespace separate sections; use shadows only for existing menus or transient overlays, not as the default treatment for topic and question content.

## Shapes

Topic rows, rules, and primary controls use square corners. Circular shapes are reserved for small status marks or profile indicators where already present.

## Components

- **Topic index:** Numbered rows show official guide sections. The selected topic uses a narrow vermilion rule and darker text.
- **Primary action:** A vermilion rectangular button with light text; hover feedback changes contrast without changing its geometry.
- **Question metadata:** Source and topic details appear in a disclosure below the prompt and choices during a timed exam.
- **Question choices:** Large, clearly separated options support quick scanning and selection.

## Do's and Don'ts

- Do preserve official subject, section, topic, and source wording.
- Do keep weak-topic practice as the home page's first useful action.
- Do keep the question and choices visually dominant during timed exams.
- Do use the red accent sparingly for state and action.
- Don't add decorative AI imagery, invented performance metrics, or generic dashboard cards.
- Don't hide source attribution or make the user decode a second visual metaphor.
