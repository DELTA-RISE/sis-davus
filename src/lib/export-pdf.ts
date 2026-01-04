
import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import { Product, Asset, MaintenanceTask } from "./store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- Constants ---
const BRAND_ORANGE = "#ff5d38";
const BRAND_DARK = "#181a1c";
const BRAND_GREY = "#2b2b2b";
const BRAND_LIGHT = "#ffffff";

// Helper to load image
async function getLogoBase64(): Promise<string> {
    return new Promise(async (resolve) => {
        try {
            const response = await fetch("/davus-logo.png"); // Using black/colored logo for white paper if available, or white if dark bg. Let's assume standard logo.
            // Actually standard pdf is white background, so we want the dark logo or orange. 
            // If we don't have a specific pdf logo, we might use the white one and put a dark background header?
            // Let's try to fetch the white one and we'll draw a dark rect behind it.
            const res = await fetch("/davus-logo-white.png");
            if (!res.ok) throw new Error("Logo not found");
            const blob = await res.blob();
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve("");
            reader.readAsDataURL(blob);
        } catch (e) {
            resolve("");
        }
    });
}

// --- Base PDF Setup ---
async function createPDFBase(title: string): Promise<jsPDF> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // 1. Header Background
    doc.setFillColor(BRAND_DARK);
    doc.rect(0, 0, pageWidth, 40, "F");

    // 2. Logo
    const logo = await getLogoBase64();
    if (logo) {
        doc.addImage(logo, "PNG", 15, 10, 40, 15); // Adjust dimensions as needed
    } else {
        doc.setTextColor(BRAND_LIGHT);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("DAVUS", 15, 20);
    }

    // 3. Title & Date
    doc.setTextColor(BRAND_ORANGE);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SISTEMA DE GESTÃO INTELIGENTE", pageWidth - 15, 15, { align: "right" });

    doc.setTextColor(BRAND_LIGHT);
    doc.setFontSize(16);
    doc.text(title.toUpperCase(), pageWidth - 15, 25, { align: "right" });

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, pageWidth - 15, 32, { align: "right" });

    // 4. Footer Helper
    const pageHeight = doc.internal.pageSize.height;
    // We can't easily hook into every page add here without a plugin, 
    // but autoTable has hooks for page footer.
    // We will handle footer in the main export function by iterating pages or using autoTable hooks.

    return doc;
}

// --- Footer Function ---
function addFooter(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer Line
        doc.setDrawColor(BRAND_ORANGE);
        doc.setLineWidth(0.5);
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Davus System - Relatório Confidencial", 15, pageHeight - 10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: "right" });
    }
}

// --- Export Functions ---

export async function exportProductsPDF(products: Product[]) {
    const doc = await createPDFBase("Relatório de Estoque");

    // Summary Metrics (Simple Text for now to fit in PDF structure)
    const totalValue = products.reduce((acc, p) => acc + (p.quantity * (p.unit_price || 0)), 0);
    const lowStock = products.filter(p => p.quantity < (p.min_stock || 0)).length;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de Itens: ${products.length} | Valor Total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Estoque Baixo: ${lowStock}`, 15, 50);

    const tableData = products.map(p => [
        p.sku,
        p.name,
        p.category,
        p.location,
        p.quantity,
        `R$ ${(p.unit_price || 0).toFixed(2)}`,
        `R$ ${(p.quantity * (p.unit_price || 0)).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 55,
        head: [["SKU", "Nome", "Categoria", "Local", "Qtd", "V. Unit", "Total"]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: BRAND_ORANGE, textColor: BRAND_LIGHT, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] }, // Light gray
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 20 },
            // 1: Name (Auto)
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 15, halign: 'center' },
            5: { cellWidth: 20, halign: 'right' },
            6: { cellWidth: 20, halign: 'right' },
        }
    });

    addFooter(doc);
    doc.save(`estoque_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export async function exportAssetsPDF(assets: Asset[]) {
    const doc = await createPDFBase("Relatório de Patrimônio");

    const totalValue = assets.reduce((acc, a) => acc + (a.value || 0), 0);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de Ativos: ${assets.length} | Valor Total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, 50);

    const tableData = assets.map(a => [
        a.code,
        a.name,
        a.category,
        a.location,
        a.condition,
        a.responsible,
        `R$ ${(a.value || 0).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 55,
        head: [["Código", "Nome", "Categoria", "Local", "Estado", "Responsável", "Valor"]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: BRAND_ORANGE, textColor: BRAND_LIGHT, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 20 },
            // 1: Name
            // 2: Cat
            // 3: Loc
            4: { cellWidth: 20 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25, halign: 'right' },
        }
    });

    addFooter(doc);
    doc.save(`patrimonio_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export async function exportMaintenancePDF(tasks: MaintenanceTask[]) {
    const doc = await createPDFBase("Relatório de Manutenção");

    const pending = tasks.filter(t => t.status !== 'concluido').length;
    const overdue = tasks.filter(t => t.status !== 'concluido' && t.due_date && new Date(t.due_date) < new Date()).length;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de Tarefas: ${tasks.length} | Pendentes: ${pending} | Atrasadas: ${overdue}`, 15, 50);

    const tableData: (string | number)[][] = tasks.map(t => [
        t.title,
        t.asset_name,
        t.priority.toUpperCase(),
        t.status.toUpperCase(),
        t.due_date ? format(new Date(t.due_date), "dd/MM/yyyy") : "-",
        t.assigned_to || "-"
    ]);

    // Color logic for cells? autoTable supports didParseCell
    autoTable(doc, {
        startY: 55,
        head: [["Título", "Ativo", "Prioridade", "Status", "Vencimento", "Responsável"]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: BRAND_ORANGE, textColor: BRAND_LIGHT, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        styles: { fontSize: 8, cellPadding: 3 },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 2) { // Priority
                const val = data.cell.raw as string;
                if (val === 'ALTA' || val === 'URGENTE') {
                    data.cell.styles.textColor = [220, 38, 38]; // Red
                    data.cell.styles.fontStyle = 'bold';
                }
            }
            if (data.section === 'body' && data.column.index === 3) { // Status
                const val = data.cell.raw as string;
                if (val !== 'CONCLUIDO') {
                    // maybe orange
                }
            }
        }
    });

    addFooter(doc);
    doc.save(`manutencao_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export async function exportOverviewPDF(products: Product[], assets: Asset[], tasks: MaintenanceTask[]) {
    const doc = await createPDFBase("Relatório Gerencial");

    // Calculate Metrics
    const totalStockValue = products.reduce((acc, p) => acc + (p.quantity * (p.unit_price || 0)), 0);
    const totalAssetValue = assets.reduce((acc, a) => acc + (a.value || 0), 0);
    const lowStock = products.filter(p => p.quantity < (p.min_stock || 0));
    const criticalStock = products.filter(p => p.quantity === 0);
    const pendingMaintenance = tasks.filter(t => t.status !== 'concluido').length;
    const overdueMaintenance = tasks.filter(t => t.status !== 'concluido' && t.due_date && new Date(t.due_date) < new Date()).length;
    const assetsInMaintenance = assets.filter(a => a.condition === "Manutenção").length;

    // Monthly movements
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();


    // Summary Section - Expanded
    doc.setFontSize(12);
    doc.setTextColor(BRAND_ORANGE);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO", 15, 50);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    const yStart = 58;
    const lineHeight = 6;
    const col1X = 15;
    const col2X = 110;

    // Column 1
    doc.text(`Valor Total em Estoque: R$ ${totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, col1X, yStart);
    doc.text(`Valor Patrimonial: R$ ${totalAssetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, col1X, yStart + lineHeight);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Investido: R$ ${(totalStockValue + totalAssetValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, col1X, yStart + lineHeight * 2);
    doc.setFont("helvetica", "normal");
    doc.text(`Itens com Estoque Baixo: ${lowStock.length}`, col1X, yStart + lineHeight * 3);

    // Column 2
    doc.text(`Itens Esgotados: ${criticalStock.length}`, col2X, yStart);
    doc.text(`Manutenções Pendentes: ${pendingMaintenance}`, col2X, yStart + lineHeight);
    doc.text(`Manutenções Atrasadas: ${overdueMaintenance}`, col2X, yStart + lineHeight * 2);
    doc.text(`Ativos em Manutenção: ${assetsInMaintenance}`, col2X, yStart + lineHeight * 3);

    let currentY = yStart + lineHeight * 5;

    // Top 5 Produtos Mais Valiosos
    const topProducts = [...products]
        .map(p => ({ ...p, totalValue: p.quantity * (p.unit_price || 0) }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5);

    if (topProducts.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(BRAND_ORANGE);
        doc.setFont("helvetica", "bold");
        doc.text("TOP 5 PRODUTOS MAIS VALIOSOS", 15, currentY);

        const productsData = topProducts.map(p => [
            p.name,
            p.category,
            p.quantity.toString(),
            `R$ ${(p.unit_price || 0).toFixed(2)}`,
            `R$ ${p.totalValue.toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [["Produto", "Categoria", "Qtd", "V. Unit", "Total"]],
            body: productsData,
            theme: 'grid',
            headStyles: { fillColor: BRAND_ORANGE, textColor: BRAND_LIGHT, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 248, 248] },
            styles: { fontSize: 8, cellPadding: 2 },
        });

        currentY = (doc as any).lastAutoTable?.finalY + 10 || currentY + 50;
    }

    // Top 5 Ativos Mais Valiosos
    const topAssets = [...assets]
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 5);

    if (topAssets.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(BRAND_ORANGE);
        doc.setFont("helvetica", "bold");
        doc.text("TOP 5 ATIVOS MAIS VALIOSOS", 15, currentY);

        const assetsData = topAssets.map(a => [
            a.code,
            a.name,
            a.category,
            `R$ ${(a.value || 0).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [["Código", "Nome", "Categoria", "Valor"]],
            body: assetsData,
            theme: 'grid',
            headStyles: { fillColor: BRAND_ORANGE, textColor: BRAND_LIGHT, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 248, 248] },
            styles: { fontSize: 8, cellPadding: 2 },
        });

        currentY = (doc as any).lastAutoTable?.finalY + 10 || currentY + 50;
    }

    // Critical Stock Alert
    if (criticalStock.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(239, 68, 68);
        doc.setFont("helvetica", "bold");
        doc.text("ESTOQUE CRÍTICO (ESGOTADOS)", 15, currentY);

        const criticalData = criticalStock.slice(0, 10).map(p => [
            p.name,
            p.category,
            p.location
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [["Produto", "Categoria", "Local"]],
            body: criticalData,
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68], textColor: BRAND_LIGHT, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [254, 226, 226] },
            styles: { fontSize: 8, cellPadding: 2 },
        });

        currentY = (doc as any).lastAutoTable?.finalY + 10 || currentY + 50;
    }

    // Low Stock Alert Table (if not critical)
    const lowStockNotCritical = lowStock.filter(p => p.quantity > 0);
    if (lowStockNotCritical.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(BRAND_ORANGE);
        doc.setFont("helvetica", "bold");
        doc.text("ALERTAS DE ESTOQUE BAIXO", 15, currentY);

        const lowStockData = lowStockNotCritical.slice(0, 10).map(p => [
            p.name,
            p.category,
            p.quantity.toString(),
            (p.min_stock || 0).toString()
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [["Produto", "Categoria", "Qtd Atual", "Qtd Mínima"]],
            body: lowStockData,
            theme: 'grid',
            headStyles: { fillColor: [234, 179, 8], textColor: BRAND_LIGHT, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [254, 243, 199] },
            styles: { fontSize: 8, cellPadding: 2 },
        });

        currentY = (doc as any).lastAutoTable?.finalY + 10 || currentY + 50;
    }

    // Maintenance Alerts
    const lateTasks = tasks.filter(t => t.status !== 'concluido' && t.due_date && new Date(t.due_date) < new Date()).slice(0, 10);
    if (lateTasks.length > 0) {
        const nextY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY;

        doc.setFontSize(11);
        doc.setTextColor(239, 68, 68);
        doc.setFont("helvetica", "bold");
        doc.text("MANUTENÇÕES ATRASADAS", 15, nextY);

        const maintenanceData = lateTasks.map(t => [
            t.title,
            t.asset_name,
            t.priority.toUpperCase(),
            t.due_date ? format(new Date(t.due_date), "dd/MM/yyyy") : "-"
        ]);

        autoTable(doc, {
            startY: nextY + 5,
            head: [["Tarefa", "Ativo", "Prioridade", "Vencimento"]],
            body: maintenanceData,
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68], textColor: BRAND_LIGHT, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [254, 226, 226] },
            styles: { fontSize: 8, cellPadding: 2 },
        });
    }

    addFooter(doc);
    doc.save(`relatorio_gerencial_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

