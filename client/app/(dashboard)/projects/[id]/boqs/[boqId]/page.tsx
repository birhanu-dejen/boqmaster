import { BoqGrid } from "@/features/boq/boq-grid";

export default function BoqPage() {
  return (
    <div className="w-full">
      <h1 className="mb-4 text-xl font-semibold">Bill of Quantities</h1>
      <BoqGrid />
    </div>
  );
}
