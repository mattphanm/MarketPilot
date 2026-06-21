# Selectively import Figma UI primitives

MarketPilot should match the Figma export's layout and visual treatment closely, but should not import the entire generated `ui/` folder by default. The export includes a broad dependency surface that is larger than the current app needs; instead, the implementation should port the relevant view components, theme tokens, chart dependency, and only the UI primitives required for the logged-trade workflow.
