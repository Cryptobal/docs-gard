/**
 * Detalle de cotización CPQ
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/opai";
import { CreatePositionModal } from "@/components/cpq/CreatePositionModal";
import { CpqPositionCard } from "@/components/cpq/CpqPositionCard";
import { formatCurrency } from "@/components/cpq/utils";
import type { CpqQuote, CpqPosition } from "@/types/cpq";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface CpqQuoteDetailProps {
  quoteId: string;
}

export function CpqQuoteDetail({ quoteId }: CpqQuoteDetailProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<CpqQuote | null>(null);
  const [positions, setPositions] = useState<CpqPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cpq/quotes/${quoteId}`);
      const data = await res.json();
      if (data.success) {
        setQuote(data.data);
        setPositions(data.data.positions || []);
      }
    } catch (err) {
      console.error("Error loading CPQ quote:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [quoteId]);

  const stats = useMemo(() => {
    const totalGuards = positions.reduce((sum, p) => sum + p.numGuards, 0);
    const monthly = positions.reduce((sum, p) => sum + Number(p.monthlyPositionCost), 0);
    return { totalGuards, monthly };
  }, [positions]);

  if (loading && !quote) {
    return <div className="text-xs text-muted-foreground">Cargando...</div>;
  }

  if (!quote) {
    return (
      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/cpq")}>
          Volver
        </Button>
        <div className="text-sm text-muted-foreground">Cotización no encontrada.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/cpq">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader
            title={quote.code}
            description={quote.clientName || "Sin cliente"}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={refresh}>
            <RefreshCw className="h-3 w-3" />
            Actualizar
          </Button>
          <CreatePositionModal quoteId={quoteId} onCreated={refresh} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-[10px] uppercase text-blue-400/80">Puestos</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-blue-400">
            {positions.length}
          </p>
        </Card>
        <Card className="border-purple-500/20 bg-purple-500/5 p-4">
          <p className="text-[10px] uppercase text-purple-400/80">Guardias</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-purple-400">
            {stats.totalGuards}
          </p>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-[10px] uppercase text-emerald-400/80">Costo mensual</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-emerald-400">
            {formatCurrency(stats.monthly)}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Puestos de trabajo</h2>
            <Badge variant="outline" className="text-[10px]">
              {quote.status}
            </Badge>
          </div>
        </div>

        {positions.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            Agrega el primer puesto para comenzar la estructura de servicio.
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((position) => (
              <CpqPositionCard
                key={position.id}
                position={position}
                quoteId={quoteId}
                onUpdated={refresh}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
