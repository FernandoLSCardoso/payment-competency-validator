import { useState, useMemo } from "react";
import { Pencil, Check, AlertTriangle, ChevronDown } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Vigencia {
  id: string;
  label: string;
  inicio: string; // DD/MM/YYYY
  fim: string;    // DD/MM/YYYY
  valorTotal: number;
}

interface Pagamento {
  id: string;
  codigo: string;
  data: string;
  valor: number;
  competencia: string; // MM/YYYY
  competenciaEditada: boolean;
  observacao?: string;
  vigenciaId: string;
}

function parseDate(d: string): Date {
  const [dia, mes, ano] = d.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

function competenciaToDate(c: string): Date {
  const [mes, ano] = c.split("/").map(Number);
  return new Date(ano, mes - 1, 1);
}

function extrairCompetencia(data: string): string {
  const [, mes, ano] = data.split("/");
  return `${mes}/${ano}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function findVigenciaForCompetencia(competencia: string, vigencias: Vigencia[]): string | null {
  const compDate = competenciaToDate(competencia);
  for (const v of vigencias) {
    const inicio = parseDate(v.inicio);
    const fim = parseDate(v.fim);
    // competência month falls within vigência range
    if (compDate >= new Date(inicio.getFullYear(), inicio.getMonth(), 1) &&
        compDate <= new Date(fim.getFullYear(), fim.getMonth(), 1)) {
      return v.id;
    }
  }
  return null;
}

const vigencias: Vigencia[] = [
  { id: "v1", label: "Inicial", inicio: "10/06/2022", fim: "09/06/2023", valorTotal: 1_200_000 },
  { id: "v2", label: "1º Aditivo de Prorrogação", inicio: "10/06/2023", fim: "09/06/2024", valorTotal: 1_350_000 },
  { id: "v3", label: "2º Aditivo de Prorrogação", inicio: "10/06/2024", fim: "09/06/2025", valorTotal: 1_500_000 },
  { id: "v4", label: "3º Aditivo de Prorrogação", inicio: "10/06/2025", fim: "09/06/2026", valorTotal: 1_650_000 },
];

const initialPagamentos: Pagamento[] = [
  // Vigência Inicial
  { id: "1", codigo: "20220600101", data: "15/07/2022", valor: 98_500, competencia: "07/2022", competenciaEditada: false, vigenciaId: "v1" },
  { id: "2", codigo: "20220600202", data: "10/09/2022", valor: 145_200, competencia: "09/2022", competenciaEditada: false, vigenciaId: "v1" },
  { id: "3", codigo: "20220600303", data: "20/12/2022", valor: 210_000, competencia: "12/2022", competenciaEditada: false, vigenciaId: "v1" },
  { id: "4", codigo: "20230600104", data: "05/03/2023", valor: 78_350, competencia: "03/2023", competenciaEditada: false, vigenciaId: "v1" },
  // 1º Aditivo
  { id: "5", codigo: "20230600205", data: "18/07/2023", valor: 132_400, competencia: "07/2023", competenciaEditada: false, vigenciaId: "v2" },
  { id: "6", codigo: "20230600306", data: "25/10/2023", valor: 187_600, competencia: "10/2023", competenciaEditada: false, vigenciaId: "v2" },
  { id: "7", codigo: "20240600107", data: "14/01/2024", valor: 95_000, competencia: "01/2024", competenciaEditada: false, vigenciaId: "v2" },
  { id: "8", codigo: "20240600208", data: "22/04/2024", valor: 163_750, competencia: "04/2024", competenciaEditada: false, vigenciaId: "v2" },
  // 2º Aditivo
  { id: "9", codigo: "20240600309", data: "08/08/2024", valor: 220_300, competencia: "08/2024", competenciaEditada: false, vigenciaId: "v3" },
  { id: "10", codigo: "20240600410", data: "12/11/2024", valor: 175_450, competencia: "11/2024", competenciaEditada: false, vigenciaId: "v3" },
  { id: "11", codigo: "20250600111", data: "03/02/2025", valor: 88_900, competencia: "02/2025", competenciaEditada: false, vigenciaId: "v3" },
  { id: "12", codigo: "20250600212", data: "20/05/2025", valor: 142_600, competencia: "04/2025", competenciaEditada: true, observacao: "Competência corrigida para abril/2025 conforme nota fiscal.", vigenciaId: "v3" },
  // 3º Aditivo
  { id: "13", codigo: "20250600313", data: "15/07/2025", valor: 312_470, competencia: "07/2025", competenciaEditada: false, vigenciaId: "v4" },
  { id: "14", codigo: "20250600414", data: "10/09/2025", valor: 245_830.50, competencia: "09/2025", competenciaEditada: false, vigenciaId: "v4" },
  { id: "15", codigo: "20260600115", data: "05/01/2026", valor: 67_120, competencia: "01/2026", competenciaEditada: false, vigenciaId: "v4" },
  { id: "16", codigo: "20260600216", data: "18/03/2026", valor: 18_950.75, competencia: "03/2026", competenciaEditada: false, vigenciaId: "v4" },
];

export default function VigenciaPayments() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>(initialPagamentos);
  const [selectedVigencia, setSelectedVigencia] = useState<string>("v4");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCompetencia, setEditCompetencia] = useState("");
  const [editObservacao, setEditObservacao] = useState("");

  const vigencia = vigencias.find((v) => v.id === selectedVigencia)!;
  const pagamentosVigencia = useMemo(
    () => pagamentos.filter((p) => p.vigenciaId === selectedVigencia),
    [pagamentos, selectedVigencia]
  );
  const editingPagamento = pagamentos.find((p) => p.id === editingId);

  const totalPago = pagamentosVigencia.reduce((s, p) => s + p.valor, 0);
  const saldoVigencia = vigencia.valorTotal - totalPago;

  function openEdit(p: Pagamento) {
    setEditingId(p.id);
    setEditCompetencia(p.competencia);
    setEditObservacao(p.observacao || "");
  }

  function saveEdit() {
    if (!editingId || !editingPagamento) return;

    const novaCompetencia = editCompetencia;
    const competenciaEditada = novaCompetencia !== extrairCompetencia(editingPagamento.data);

    // Find correct vigência for the new competência
    const novaVigenciaId = findVigenciaForCompetencia(novaCompetencia, vigencias) || editingPagamento.vigenciaId;

    setPagamentos((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? {
              ...p,
              competencia: novaCompetencia,
              competenciaEditada,
              observacao: editObservacao || undefined,
              vigenciaId: novaVigenciaId,
            }
          : p
      )
    );

    // If moved to different vigência, switch view to it
    if (novaVigenciaId !== selectedVigencia) {
      setSelectedVigencia(novaVigenciaId);
    }

    setEditingId(null);
  }

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
          {/* Section Title */}
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Dados da Vigência
            </h2>
          </div>

          <div className="space-y-0 divide-y divide-border">
            {/* Vigência Selector */}
            <div className="flex items-center px-6 py-3.5">
              <span className="w-48 shrink-0 text-sm font-medium text-label">Vigência</span>
              <Select value={selectedVigencia} onValueChange={setSelectedVigencia}>
                <SelectTrigger className="flex-1 bg-field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vigencias.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label} — {v.inicio} a {v.fim}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor Total Vigência */}
            <FieldRow label="Valor Total Vigência" value={formatCurrency(vigencia.valorTotal)} />
            {/* Valor Pago Vigência */}
            <FieldRow label="Valor Pago Vigência" value={formatCurrency(totalPago)} />

            {/* Pagamentos */}
            <div className="px-6 py-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Pagamentos na Vigência
                </span>
                <span className="text-xs text-muted-foreground">
                  {pagamentosVigencia.length} registro(s)
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
                    {pagamentosVigencia.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          Nenhum pagamento nesta vigência.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagamentosVigencia.map((p) => {
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
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Saldo */}
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
                {editingPagamento && (() => {
                  const novaVigencia = findVigenciaForCompetencia(editCompetencia, vigencias);
                  if (novaVigencia && novaVigencia !== editingPagamento.vigenciaId) {
                    const v = vigencias.find((x) => x.id === novaVigencia);
                    return (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-primary">
                        ↳ Pagamento será movido para: <strong>{v?.label}</strong>
                      </p>
                    );
                  }
                  return null;
                })()}
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
              <Button variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
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
