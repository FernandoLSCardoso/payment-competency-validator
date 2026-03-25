import { useState } from "react";
import { Pencil, Check, AlertTriangle } from "lucide-react";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Pagamento {
  id: string;
  codigo: string;
  data: string;
  valor: number;
  competencia: string; // MM/YYYY
  competenciaEditada: boolean;
  observacao?: string;
}

function extrairCompetencia(data: string): string {
  const [, mes, ano] = data.split("/");
  return `${mes}/${ano}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const initialPagamentos: Pagamento[] = [
  { id: "1", codigo: "20260300145", data: "10/01/2026", valor: 245830.50, competencia: "01/2026", competenciaEditada: false },
  { id: "2", codigo: "20260300278", data: "15/02/2026", valor: 312470.00, competencia: "02/2026", competenciaEditada: false },
  { id: "3", codigo: "20260300390", data: "05/03/2026", valor: 18950.75, competencia: "02/2026", competenciaEditada: true, observacao: "Pagamento referente a serviços prestados em fevereiro, liquidado em março." },
  { id: "4", codigo: "20260300412", data: "20/03/2026", valor: 67120.00, competencia: "03/2026", competenciaEditada: false },
  { id: "5", codigo: "20260300533", data: "12/01/2026", valor: 4500.00, competencia: "12/2025", competenciaEditada: true, observacao: "Competência corrigida para dezembro/2025 conforme nota fiscal." },
];

export default function VigenciaPayments() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>(initialPagamentos);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCompetencia, setEditCompetencia] = useState("");
  const [editObservacao, setEditObservacao] = useState("");

  const editingPagamento = pagamentos.find((p) => p.id === editingId);

  function openEdit(p: Pagamento) {
    setEditingId(p.id);
    setEditCompetencia(p.competencia);
    setEditObservacao(p.observacao || "");
  }

  function saveEdit() {
    if (!editingId) return;
    setPagamentos((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? { ...p, competencia: editCompetencia, competenciaEditada: editCompetencia !== extrairCompetencia(p.data), observacao: editObservacao || undefined }
          : p
      )
    );
    setEditingId(null);
  }

  const valorOriginal = 3_250_000.0;
  const valorTotalVigencia = 3_250_000.0;
  const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0);
  const saldoVigencia = valorTotalVigencia - totalPago;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-1 w-8 rounded-full bg-primary" />
          <h1 className="text-xl font-semibold text-foreground">
            Cadastro Administrativo de Contratos
          </h1>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          {/* Section: Vigência */}
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Dados da Vigência
            </h2>
          </div>

          <div className="space-y-0 divide-y divide-border">
            {/* Valor Original */}
            <FieldRow label="Valor Original" value={formatCurrency(valorOriginal)} />
            {/* Vigência */}
            <FieldRow label="Vigência" value="Inicial — 15/01/2026 a 14/01/2027" />
            {/* Valor Total Vigência */}
            <FieldRow label="Valor Total Vigência" value={formatCurrency(valorTotalVigencia)} />
            {/* Valor Pago Vigência */}
            <FieldRow label="Valor Pago Vigência" value={formatCurrency(totalPago)} />

            {/* Pagamentos na Vigência */}
            <div className="px-6 py-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Pagamentos na Vigência
                </span>
                <span className="text-xs text-muted-foreground">
                  {pagamentos.length} registro(s)
                </span>
              </div>

              <div className="overflow-hidden rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead className="text-xs font-semibold uppercase">Código</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Data</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Valor</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Competência</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Validação</TableHead>
                      <TableHead className="w-12 text-xs font-semibold uppercase">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagamentos.map((p) => {
                      const competenciaEsperada = extrairCompetencia(p.data);
                      const isValid = p.competencia === competenciaEsperada;

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-sm">{p.codigo}</TableCell>
                          <TableCell className="text-sm">{p.data}</TableCell>
                          <TableCell className="text-sm font-medium">{formatCurrency(p.valor)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{p.competencia}</span>
                              {p.competenciaEditada && (
                                <Badge variant="outline" className="border-warning bg-warning/10 text-xs text-warning-foreground">
                                  Alterada
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isValid ? (
                              <div className="flex items-center gap-1.5 text-success">
                                <Check className="h-4 w-4" />
                                <span className="text-xs font-medium">Válida</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-warning" title={p.observacao}>
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs font-medium">Divergente</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(p)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Saldo Vigência */}
            <FieldRow label="Saldo Vigência" value={formatCurrency(saldoVigencia)} highlight />
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Competência</DialogTitle>
              <DialogDescription>
                Pagamento: <strong>{editingPagamento?.codigo}</strong> — Data: {editingPagamento?.data}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Competência (MM/AAAA)
                </label>
                <Input
                  value={editCompetencia}
                  onChange={(e) => setEditCompetencia(e.target.value)}
                  placeholder="Ex: 03/2026"
                />
                {editingPagamento && editCompetencia !== extrairCompetencia(editingPagamento.data) && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-warning">
                    <AlertTriangle className="h-3 w-3" />
                    Competência diferente da data de pagamento ({extrairCompetencia(editingPagamento.data)})
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Observação <span className="text-muted-foreground">(motivo da alteração)</span>
                </label>
                <Textarea
                  value={editObservacao}
                  onChange={(e) => setEditObservacao(e.target.value)}
                  placeholder="Informe o motivo da alteração da competência..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancelar
              </Button>
              <Button onClick={saveEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function FieldRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center px-6 py-3.5">
      <span className="w-48 shrink-0 text-sm font-medium text-label">{label}</span>
      <span className={`flex-1 rounded-md bg-field px-3 py-2 text-sm ${highlight ? "font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  );
}
