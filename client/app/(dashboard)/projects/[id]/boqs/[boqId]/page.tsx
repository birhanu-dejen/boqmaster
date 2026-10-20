import { BoqGrid } from "@/features/boq/boq-grid";
import { getBoqDetail } from "@/lib/api/boq.server";

type Props = { params: Promise<{ id: string; boqId: string }> };

export default async function BoqPage({ params }: Props) {
  const { boqId } = await params;
  const boq = await getBoqDetail(boqId);

  return (
    <div className="w-full">
      <h1 className="mb-4 text-xl font-semibold">{boq.name}</h1>
      <BoqGrid boqId={boq.id} initial={boq.sections} />
    </div>
  );
}
