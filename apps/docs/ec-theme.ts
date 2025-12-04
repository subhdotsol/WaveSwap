import githubDark from "@shikijs/themes/github-dark";
import githubLight from "@shikijs/themes/github-light";
import type { ThemeRegistration } from "shiki";

const ionDark: ThemeRegistration = {
  ...githubDark,
  name: "WaveTek Dark",
  colors: {
    ...githubDark.colors,
    // WaveSwap dark theme colors
    "activityBar.background": "#181A20",      // WaveTek bg-main
    "editor.background": "#181A20",           // WaveTek bg-main
    "statusBar.background": "#1A1D26",        // WaveTek bg-panel
    "statusBarItem.remoteBackground": "#1A1D26",
    "tab.activeBackground": "#222236",        // WaveTek bg-card
    "titleBar.activeBackground": "#181A20",
    "editorGroupHeader.tabsBackground": "#1A1D26",
    "panel.background": "#1A1D26",
    // Accent colors
    "focusBorder": "#21bcff",                 // WaveTek accent
    "activeBorder": "#21bcff",                // WaveTek accent
    "selection.background": "#21bcff20",      // WaveTek accent with transparency
  },
};

const ionLight: ThemeRegistration = {
  ...githubLight,
  name: "WaveTek Light",
  colors: {
    ...githubLight.colors,
    // WaveSwap light theme colors
    "activityBar.background": "#ffffff",      // White background
    "editor.background": "#ffffff",           // White background
    "statusBar.background": "#f8fafc",        // Light gray
    "statusBarItem.remoteBackground": "#f8fafc",
    "tab.activeBackground": "#ffffff",        // White background
    "titleBar.activeBackground": "#ffffff",
    "editorGroupHeader.tabsBackground": "#f1f5f9",
    "panel.background": "#ffffff",
    // Accent colors
    "focusBorder": "#264af5",                 // WaveTek primary
    "activeBorder": "#264af5",                // WaveTek primary
    "selection.background": "#264af520",      // WaveTek primary with transparency
  },
};

export { ionDark, ionLight };
