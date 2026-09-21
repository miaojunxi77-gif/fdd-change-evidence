import GeographyExplorer from "./geography-explorer";
import "./geography.css";

export default function GeographyPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return <GeographyExplorer basePath={basePath} />;
}
