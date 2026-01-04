import { Product, Asset, StockMovement, Checkout, MaintenanceTask } from "./store";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- Helpers ---

// Helper to determine stock status
const getStockStatus = (product: Product) => {
  if (product.quantity < (product.min_stock || 0)) return "Baixo";
  if (product.quantity > (product.max_stock || 9999)) return "Excesso";
  return "Normal";
};

// Convert PNG to Base64 for Excel
async function getLogoBase64(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch("/davus-logo-white.png");
      if (!response.ok) throw new Error("Logo PNG not found");
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    } catch (e) {
      console.warn("Logo load failed:", e);
      // Fallback to empty string or handle gracefully
      resolve("");
    }
  });
}

// --- Styles ---

// --- Styles ---

const BRAND_PRIMARY = 'FFFF5D38'; // #ff5d38 (Vibrant Orange)
const BRAND_SECONDARY = 'FFE87350'; // #e87350 (Mid Orange)
const BRAND_TERTIARY = 'FFDC7759'; // #dc7759 (Muted Orange)

const BRAND_DARK_BG = 'FF181A1C'; // #181a1c (Deep Dark)
const BRAND_CARD_BG = 'FF2B2B2B'; // #2b2b2b (Card Gray)

const BRAND_TEXT_LIGHT = 'FFEDEDED';
const BRAND_BORDER = 'FF2B2B2B';

// --- Enhanced Utility Helpers ---

// Add a Metadata Sheet (Hidden by default or just last)
function addMetadataSheet(workbook: ExcelJS.Workbook, user?: string) {
  const sheet = workbook.addWorksheet("Metadados");
  sheet.state = 'hidden';

  sheet.getCell('A1').value = "Sistema";
  sheet.getCell('B1').value = "Davus Management System";

  sheet.getCell('A2').value = "Versão";
  sheet.getCell('B2').value = "1.0.0";

  sheet.getCell('A3').value = "Gerado por";
  sheet.getCell('B3').value = user || "Sistema";

  sheet.getCell('A4').value = "Gerado em";
  sheet.getCell('B4').value = new Date().toISOString();

  sheet.columns = [{ width: 20 }, { width: 50 }];
}

// Add Signature Area at the bottom of a sheet
function addSignatureArea(sheet: ExcelJS.Worksheet, startRow: number) {
  const r = startRow + 5; // Spacing

  // Signature 1
  sheet.getCell(`B${r}`).value = "_______________________________";
  sheet.getCell(`B${r}`).alignment = { horizontal: 'center' };
  sheet.getCell(`B${r + 1}`).value = "Responsável pelo Setor";
  sheet.getCell(`B${r + 1}`).alignment = { horizontal: 'center' };

  // Signature 2
  sheet.getCell(`F${r}`).value = "_______________________________";
  sheet.getCell(`F${r}`).alignment = { horizontal: 'center' };
  sheet.getCell(`F${r + 1}`).value = "Conferido por";
  sheet.getCell(`F${r + 1}`).alignment = { horizontal: 'center' };
}

const styles = {
  title: {
    font: { name: 'Arial', size: 18, bold: true, color: { argb: BRAND_PRIMARY } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } },
  } as Partial<ExcelJS.Style>,
  header: {
    font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_PRIMARY } },
    border: {
      top: { style: 'thin', color: { argb: BRAND_BORDER } },
      left: { style: 'thin', color: { argb: BRAND_BORDER } },
      bottom: { style: 'thin', color: { argb: BRAND_BORDER } },
      right: { style: 'thin', color: { argb: BRAND_BORDER } }
    }
  } as Partial<ExcelJS.Style>,
  cell: {
    font: { name: 'Arial', size: 10, color: { argb: 'FF1F2937' } },
    border: {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    },
    alignment: { vertical: 'middle', wrapText: true }
  } as Partial<ExcelJS.Style>,
  dashboardCard: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }, // Dark gray card
    font: { name: 'Arial', size: 12, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'medium', color: { argb: BRAND_PRIMARY } }, // Brand Top Border
      left: { style: 'thin', color: { argb: 'FF374151' } },
      right: { style: 'thin', color: { argb: 'FF374151' } },
      bottom: { style: 'thin', color: { argb: 'FF374151' } }
    }
  } as Partial<ExcelJS.Style>,
  dashboardValue: {
    font: { name: 'Arial', size: 24, bold: true, color: { argb: BRAND_PRIMARY } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  } as Partial<ExcelJS.Style>
};

// --- Specialized Export Functions ---

async function exportProductsXLSX(products: Product[], filename: string) {
  const workbook = new ExcelJS.Workbook();

  // --- 1. Dashboard Sheet ("Resumo") ---
  const summarySheet = workbook.addWorksheet("Resumo", { views: [{ showGridLines: false }] });

  const totalItems = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const totalValue = products.reduce((acc, p) => acc + ((p.quantity || 0) * (p.unit_price || 0)), 0);
  const lowStockArg = products.filter(p => p.quantity < (p.min_stock || 0)).length;
  const highStockArg = products.filter(p => p.quantity > (p.max_stock || 9999)).length;

  // New Metrics
  const outOfStockArg = products.filter(p => (p.quantity || 0) === 0).length;
  const uniqueCategories = new Set(products.map(p => p.category)).size;
  const avgPrice = totalItems > 0 ? totalValue / totalItems : 0;

  // 1. Header Background (Black) - Rows 1-3
  summarySheet.mergeCells('A1:K3');
  const headerBg = summarySheet.getCell('A1');
  headerBg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };

  // 2. ORANGE STRIP + TITLE - Row 4
  summarySheet.mergeCells('A4:K4');
  const stripTitle = summarySheet.getCell('A4');
  stripTitle.value = "DASHBOARD DE ESTOQUE";
  stripTitle.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_SECONDARY } },
    font: { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  summarySheet.getRow(4).height = 30; // Slightly taller for title

  // 3. DARK BACKGROUND (Rows 5-20)
  for (let r = 5; r <= 20; r++) {
    for (let c = 1; c <= 11; c++) {
      summarySheet.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };
    }
  }

  try {
    const logoBase64 = await getLogoBase64();
    const logoId = workbook.addImage({ base64: logoBase64, extension: 'png' });
    summarySheet.addImage(logoId, {
      tl: { col: 4.8, row: 0.2 }, // Centered (approx)
      ext: { width: 144, height: 48 }
    });
  } catch (e) {
    console.warn("Could not load logo", e);
  }

  // KPI Cards (Start Row 6)
  const createCard = (col: string, row: number, title: string, value: string | number, isCurrency = false, color: string = BRAND_PRIMARY) => {
    const titleRef = `${col}${row}`;
    const valRef = `${col}${row + 1}`;

    // CARD HEADER (Card BG + Orange Text) - Softer look
    summarySheet.getCell(titleRef).value = title;
    summarySheet.getCell(titleRef).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } },
      font: { name: 'Arial', size: 11, bold: true, color: { argb: BRAND_SECONDARY } }, // Orange text on Gray
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { top: { style: 'medium', color: { argb: color === 'red' ? 'FFEF4444' : (color === 'purple' ? 'FF9333EA' : BRAND_PRIMARY) } } }
    };

    // Value (On Card BG)
    const cellVal = summarySheet.getCell(valRef);
    cellVal.value = value;
    cellVal.style = {
      ...styles.dashboardValue,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } }, // explicit Gray
      font: { name: 'Arial', size: 22, bold: true, color: { argb: color === 'red' ? 'FFEF4444' : (color === 'purple' ? 'FF9333EA' : BRAND_PRIMARY) } } // Colored text
    };
    if (isCurrency) cellVal.numFmt = '"R$" #,##0.00';
  };

  createCard('B', 6, "Qtd. Total de Itens", totalItems);
  createCard('D', 6, "Valor Total em Estoque", totalValue, true);
  createCard('F', 6, "Estoque Baixo (Alerta)", lowStockArg);
  createCard('H', 6, "Excesso de Estoque", highStockArg);

  // Row 2 of Cards (Row 9)
  createCard('B', 9, "Itens Esgotados", outOfStockArg, false, 'red');
  createCard('D', 9, "Total de Categorias", uniqueCategories);
  createCard('F', 9, "Preço Médio / Item", avgPrice, true);

  // Columns aesthetics
  summarySheet.getColumn('A').width = 2; // Margin
  summarySheet.getColumn('B').width = 25;
  summarySheet.getColumn('C').width = 5;
  summarySheet.getColumn('D').width = 25;
  summarySheet.getColumn('E').width = 5;
  summarySheet.getColumn('F').width = 25;
  summarySheet.getColumn('G').width = 5;
  summarySheet.getColumn('H').width = 25;


  // --- 2. Data Sheet ("Relatório") ---
  const worksheet = workbook.addWorksheet("Relatório");

  const columns = [
    { header: "Nome", key: "name", width: 40 },
    { header: "SKU", key: "sku", width: 15 },
    { header: "Categoria", key: "category", width: 20 },
    { header: "Local", key: "location", width: 20 },
    { header: "Qtd", key: "quantity", width: 12, type: 'number' },  // E
    { header: "Qtd Mín", key: "min_stock", width: 12, type: 'number' }, // F
    { header: "Qtd Máx", key: "max_stock", width: 12, type: 'number' }, // G
    { header: "Preço Unit.", key: "unit_price", width: 15, type: 'currency' }, // H
    { header: "TOTAL", key: "total", width: 15, type: 'currency', isFormula: true }, // I
    { header: "Status", key: "status", width: 15, type: 'status' } // J
  ];

  // Header strip
  const lastColLetter = String.fromCharCode(65 + columns.length - 1);
  worksheet.mergeCells(`A1:${lastColLetter}2`);
  const headerTitle = worksheet.getCell('A1');
  headerTitle.value = "RELATÓRIO DE ESTOQUE DETALHADO";
  headerTitle.style = { ...styles.title };

  // Date Subtitle (Row 3)
  worksheet.mergeCells(`A3:${lastColLetter}3`);
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `DAVUS SYSTEM | Gerado em: ${new Date().toLocaleString('pt-BR')}`;
  dateCell.style = {
    font: { name: 'Arial', size: 10, italic: true, color: { argb: BRAND_TEXT_LIGHT } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } }
  };

  // Spacer Strip (Row 4)
  worksheet.getRow(4).height = 5;
  for (let c = 1; c <= columns.length; c++) {
    worksheet.getRow(4).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_PRIMARY } };
  }

  const headerRow = worksheet.getRow(5);
  headerRow.height = 35;
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header.toUpperCase();
    cell.style = { ...styles.header };
    worksheet.getColumn(idx + 1).width = col.width;
  });

  // AutoFilter
  worksheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: columns.length } };

  // Data
  products.forEach((p: any, i) => {
    const rowIdx = 6 + i;
    const row = worksheet.getRow(rowIdx);

    row.getCell(1).value = p.name;
    row.getCell(2).value = p.sku;
    row.getCell(3).value = p.category;
    row.getCell(4).value = p.location;
    row.getCell(5).value = p.quantity;
    row.getCell(6).value = p.min_stock;
    row.getCell(7).value = p.max_stock;
    row.getCell(8).value = p.unit_price;

    // Formula: Quantity (Col E) * Unit Price (Col H)
    // I6 = E6 * H6
    row.getCell(9).value = { formula: `E${rowIdx}*H${rowIdx}` };

    row.getCell(10).value = getStockStatus(p);

    // Styling
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.style = { ...styles.cell };
      cell.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
      if (rowIdx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }; // Zebra

      // Specific alignment
      if (colNumber >= 5 && colNumber <= 9) cell.alignment = { horizontal: 'right' };

      // Currency Format
      if (colNumber === 8 || colNumber === 9) cell.numFmt = '"R$" #,##0.00';
    });

    row.commit();
  });

  const lastRow = 6 + products.length - 1;

  // Conditions
  // Low Stock (Red) - Col 5 < Col 6
  worksheet.addConditionalFormatting({
    ref: `E6:E${lastRow}`,
    rules: [{
      priority: 1, type: 'expression', formulae: [`=$E${6}<$F${6}`], // Note: ExcelJS logic sometimes tricky with relative refs in ranges
      style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } }, font: { color: { argb: 'FFDC2626' }, bold: true } }
    }]
  });
  // High Stock
  worksheet.addConditionalFormatting({
    ref: `E6:E${lastRow}`,
    rules: [{
      priority: 2, type: 'expression', formulae: [`=$E${6}>$G${6}`],
      style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEF3C7' } }, font: { color: { argb: 'FFD97706' }, bold: true } }
    }]
  });

  // Status text
  worksheet.addConditionalFormatting({
    ref: `J6:J${lastRow}`,
    rules: [
      { priority: 3, type: 'containsText', operator: 'containsText', text: 'Baixo', style: { font: { color: { argb: 'FFEF4444' }, bold: true } } },
      { priority: 4, type: 'containsText', operator: 'containsText', text: 'Excesso', style: { font: { color: { argb: 'FFF59E0B' }, bold: true } } }
    ]
  });

  // Add Signature Area
  addSignatureArea(worksheet, lastRow);

  // Add Metadata
  addMetadataSheet(workbook, "Gerente de Estoque");

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${filename}.xlsx`);
}

async function exportAssetsXLSX(assets: Asset[], filename: string) {
  const workbook = new ExcelJS.Workbook();

  // --- 1. Dashboard (Resumo) ---
  const summarySheet = workbook.addWorksheet("Resumo", { views: [{ showGridLines: false }] });

  const totalAssets = assets.length;
  const totalValue = assets.reduce((acc, a) => acc + (a.value || 0), 0);
  const maintenanceCount = assets.filter(a => a.condition === "Manutenção").length;

  // New Metrics
  const unassignedAssets = assets.filter(a => !a.responsible || a.responsible === "N/A" || a.responsible === "").length;
  const uniqueCategories = new Set(assets.map(a => a.category)).size;
  const avgAssetValue = totalAssets > 0 ? totalValue / totalAssets : 0;

  // Category Breakdown for Table
  const categoryMap = assets.reduce((acc, asset) => {
    const cat = asset.category || "Sem Categoria";
    acc[cat] = (acc[cat] || 0) + (asset.value || 0);
    return acc;
  }, {} as Record<string, number>);
  const categoryList = Object.entries(categoryMap)
    .map(([name, val]) => ({ name, val }))
    .sort((a, b) => b.val - a.val); // Descending Value

  // 1. Header Background (Deep Dark) - Rows 1-3
  summarySheet.mergeCells('A1:K3');
  const headerBg = summarySheet.getCell('A1');
  headerBg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };

  // 2. ORANGE STRIP + TITLE - Row 4 (Secondary Orange)
  summarySheet.mergeCells('A4:K4');
  const stripTitle = summarySheet.getCell('A4');
  stripTitle.value = "DASHBOARD PATRIMONIAL";
  stripTitle.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_SECONDARY } },
    font: { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  summarySheet.getRow(4).height = 30;

  // 3. DARK BACKGROUND (Rows 5-40) - Expanded for new content
  for (let r = 5; r <= 40; r++) {
    for (let c = 1; c <= 11; c++) {
      summarySheet.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };
    }
  }

  // 4. Logo Centered
  try {
    const logoBase64 = await getLogoBase64();
    const logoId = workbook.addImage({ base64: logoBase64, extension: 'png' });
    summarySheet.addImage(logoId, {
      tl: { col: 4.8, row: 0.2 },
      ext: { width: 144, height: 48 }
    });
  } catch (e) { console.warn(e); }

  // --- KPI Cards (Row 6) ---
  const createCard = (col: string, row: number, title: string, value: string | number, isCurrency = false, color: string = BRAND_PRIMARY) => {
    const titleRef = `${col}${row}`;
    const valRef = `${col}${row + 1}`;

    // Card Header (Using Card BG + Orange Text)
    summarySheet.getCell(titleRef).value = title;
    summarySheet.getCell(titleRef).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } },
      font: { name: 'Arial', size: 11, bold: true, color: { argb: BRAND_SECONDARY } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { top: { style: 'medium', color: { argb: color === 'red' ? 'FFEF4444' : (color === 'purple' ? 'FF9333EA' : BRAND_PRIMARY) } } }
    };

    // Value Box
    const cellVal = summarySheet.getCell(valRef);
    cellVal.value = value;
    cellVal.style = {
      ...styles.dashboardValue,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } },
      font: { name: 'Arial', size: 22, bold: true, color: { argb: color === 'red' ? 'FFEF4444' : (color === 'purple' ? 'FF9333EA' : BRAND_PRIMARY) } }
    };
    if (isCurrency) cellVal.numFmt = '"R$" #,##0.00';
  };

  createCard('B', 6, "Total de Ativos", totalAssets);
  createCard('D', 6, "Valor Total", totalValue, true);
  createCard('F', 6, "Em Manutenção", maintenanceCount, false, 'purple');

  // Row 9 Cards
  createCard('B', 9, "Sem Responsável", unassignedAssets, false, 'red');
  createCard('D', 9, "Total de Categorias", uniqueCategories);
  createCard('F', 9, "Valor Médio / Ativo", avgAssetValue, true);

  // --- Breakdown by Condition (Row 13) ---
  // Count stats
  const conditions = {
    excellent: assets.filter(a => a.condition === "Excelente").length,
    good: assets.filter(a => a.condition === "Bom").length,
    bad: assets.filter(a => a.condition === "Ruim").length,
  };

  // Section Title (White Text on Black)
  summarySheet.getCell('B12').value = "Estado de Conservação";
  summarySheet.getCell('B12').style = {
    font: { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' }, underline: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } }
  };

  const createMiniCard = (col: string, row: number, label: string, val: number, colorArgb: string) => {
    // Label on Card BG
    summarySheet.getCell(`${col}${row}`).value = label;
    summarySheet.getCell(`${col}${row}`).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } },
      font: { name: 'Arial', size: 10, bold: true, color: { argb: BRAND_TERTIARY } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { bottom: { style: 'thin', color: { argb: colorArgb } } }
    };

    // Value on Card BG
    summarySheet.getCell(`${col}${row + 1}`).value = val;
    summarySheet.getCell(`${col}${row + 1}`).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } },
      font: { name: 'Arial', size: 16, bold: true, color: { argb: colorArgb } },
      alignment: { horizontal: 'center' }
    };
  };

  createMiniCard('B', 14, "Excelente", conditions.excellent, 'FF16A34A');
  createMiniCard('C', 14, "Bom", conditions.good, BRAND_PRIMARY);
  createMiniCard('D', 14, "Ruim", conditions.bad, 'FFDC2626');


  // --- Top 5 Most Valuable Assets (Row 13, Col F) ---
  summarySheet.getCell('F12').value = "Top 5 Ativos Mais Valiosos";
  summarySheet.getCell('F12').style = {
    font: { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' }, underline: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } } // Explicit
  };

  // Header with Secondary Orange
  summarySheet.getCell('F13').value = "Ativo";
  summarySheet.getCell('G13').value = "Valor";
  summarySheet.getRow(13).getCell(6).style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_SECONDARY } },
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'left', vertical: 'middle' },
    border: { bottom: { style: 'thin', color: { argb: BRAND_DARK_BG } } }
  };
  summarySheet.getRow(13).getCell(7).style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_SECONDARY } },
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: { bottom: { style: 'thin', color: { argb: BRAND_DARK_BG } } }
  };

  // Sort and take top 5
  const topAssets = [...assets].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5);

  topAssets.forEach((asset, idx) => {
    const r = 14 + idx;
    const nameCell = summarySheet.getCell(`F${r}`);
    nameCell.value = asset.name;
    nameCell.style = { alignment: { wrapText: false } };

    const valCell = summarySheet.getCell(`G${r}`);
    valCell.value = asset.value;
    valCell.numFmt = '"R$" #,##0.00';
    valCell.alignment = { horizontal: 'right' };

    // Card BG for rows
    if (idx % 2 === 0) {
      // Even Rows - Card BG
      nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } };
      nameCell.font = { color: { argb: 'FFFFFFFF' } }; // White Text
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } };
      valCell.font = { color: { argb: 'FFFFFFFF' } };
    } else {
      // Odd Rows - Darker BG
      nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };
      nameCell.font = { color: { argb: 'FFFFFFFF' } };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };
      valCell.font = { color: { argb: 'FFFFFFFF' } };
    }
  });


  // --- Value by Category Table (Row 21, Col B-D) --- (Positioned below 'Satus')
  summarySheet.getCell('B20').value = "Valor Investido por Categoria";
  summarySheet.getCell('B20').style = {
    font: { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' }, underline: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } }
  };

  summarySheet.getCell('B21').value = "Categoria";
  summarySheet.getCell('D21').value = "Total (R$)";

  [summarySheet.getCell('B21'), summarySheet.getCell('C21'), summarySheet.getCell('D21')].forEach(cell => {
    cell.style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_SECONDARY } },
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'left', vertical: 'middle' }
    };
  });
  summarySheet.getCell('D21').alignment = { horizontal: 'right' };
  summarySheet.mergeCells('B21:C21'); // Merge Name cols

  categoryList.forEach((cat, idx) => {
    const r = 22 + idx;
    summarySheet.mergeCells(`B${r}:C${r}`);

    const nameCell = summarySheet.getCell(`B${r}`);
    nameCell.value = cat.name;

    const valCell = summarySheet.getCell(`D${r}`);
    valCell.value = cat.val;
    valCell.numFmt = '"R$" #,##0.00';
    valCell.alignment = { horizontal: 'right' };

    // Zebra
    if (idx % 2 === 0) {
      nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } };
      nameCell.font = { color: { argb: 'FFFFFFFF' } };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } };
      valCell.font = { color: { argb: 'FFFFFFFF' } };
    } else {
      nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };
      nameCell.font = { color: { argb: 'FFFFFFFF' } };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };
      valCell.font = { color: { argb: 'FFFFFFFF' } };
    }
  });


  // Column Widths
  summarySheet.getColumn('A').width = 2; // Margin
  summarySheet.getColumn('B').width = 25;
  summarySheet.getColumn('C').width = 25;
  summarySheet.getColumn('D').width = 25;
  summarySheet.getColumn('E').width = 5; // Spacer
  summarySheet.getColumn('F').width = 35; // Top Assets Name
  summarySheet.getColumn('G').width = 20; // Top Assets Value

  // --- 2. Data Sheet (Relatório) ---
  const worksheet = workbook.addWorksheet("Relatório");

  const columns = [
    { header: "Código", key: "code", width: 25 }, // Increased width
    { header: "Nome", key: "name", width: 35 },
    { header: "Categoria", key: "category", width: 20 },
    { header: "Estado", key: "condition", width: 15 }, // D
    { header: "Local", key: "location", width: 20 },
    { header: "Responsável", key: "responsible", width: 20 },
    { header: "Valor", key: "value", width: 15, type: 'currency' }, // G
    { header: "Data Aquisição", key: "acquisition_date", width: 15 }
  ];

  // Header strip
  const lastColLetter = String.fromCharCode(65 + columns.length - 1);
  worksheet.mergeCells(`A1:${lastColLetter}2`);
  const headerTitle = worksheet.getCell('A1');
  headerTitle.value = "RELATÓRIO PATRIMONIAL";
  headerTitle.style = { ...styles.title }; // Clone

  // Date Subtitle (Row 3)
  worksheet.mergeCells(`A3:${lastColLetter}3`);
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `DAVUS SYSTEM | Gerado em: ${new Date().toLocaleString('pt-BR')}`;
  dateCell.style = {
    font: { name: 'Arial', size: 10, italic: true, color: { argb: BRAND_TEXT_LIGHT } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } }
  };

  // Spacer Strip (Row 4)
  worksheet.getRow(4).height = 5;
  for (let c = 1; c <= columns.length; c++) {
    worksheet.getRow(4).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_PRIMARY } };
  }

  const headerRow = worksheet.getRow(5);
  headerRow.height = 35;
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header.toUpperCase();
    cell.style = { ...styles.header }; // Clone
    worksheet.getColumn(idx + 1).width = col.width;
  });

  worksheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: columns.length } };

  assets.forEach((item: any, i) => {
    const rowIdx = 6 + i;
    const row = worksheet.getRow(rowIdx);
    row.getCell(1).value = item.code;
    row.getCell(2).value = item.name;
    row.getCell(3).value = item.category;
    row.getCell(4).value = item.condition;
    row.getCell(5).value = item.location;
    row.getCell(6).value = item.responsible;
    row.getCell(7).value = item.value;
    row.getCell(8).value = item.acquisition_date;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.style = { ...styles.cell };
      if (rowIdx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
      if (colNumber === 7) {
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = '"R$" #,##0.00';
      }
    });
    row.commit();
  });

  const lastRow = 6 + assets.length - 1;

  // Conditions: Maintenance (Purple), Bad (Red), Excelent (Green)
  worksheet.addConditionalFormatting({
    ref: `D6:D${lastRow}`,
    rules: [
      { priority: 1, type: 'containsText', operator: 'containsText', text: 'Manutenção', style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF3E8FF' } }, font: { color: { argb: 'FF9333EA' }, bold: true } } },
      { priority: 2, type: 'containsText', operator: 'containsText', text: 'Ruim', style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } }, font: { color: { argb: 'FFEF4444' }, bold: true } } },
      { priority: 3, type: 'containsText', operator: 'containsText', text: 'Excelente', style: { font: { color: { argb: 'FF16A34A' }, bold: true } } }
    ]
  });

  // Add Signature Area
  addSignatureArea(worksheet, lastRow);

  // Add Metadata
  addMetadataSheet(workbook, "Gestor Patrimonial");

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${filename}.xlsx`);
}



async function exportMaintenanceXLSX(tasks: MaintenanceTask[], filename: string) {
  const workbook = new ExcelJS.Workbook();
  const today = new Date();

  // --- 1. Dashboard (Resumo) ---
  const summarySheet = workbook.addWorksheet("Resumo", { views: [{ showGridLines: false }] });

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status !== 'concluido').length;
  // Check if due_date is valid and < today
  const overdueTasks = tasks.filter(t => t.status !== 'concluido' && t.due_date && new Date(t.due_date) < today).length;
  const completedTasks = tasks.filter(t => t.status === 'concluido').length;

  // High Priority
  const highPriority = tasks.filter(t => t.priority === 'alta' || t.priority === 'urgente').length;

  // 1. Header Background
  summarySheet.mergeCells('A1:K3');
  const headerBg = summarySheet.getCell('A1');
  headerBg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };

  // 2. ORANGE STRIP
  summarySheet.mergeCells('A4:K4');
  const stripTitle = summarySheet.getCell('A4');
  stripTitle.value = "DASHBOARD DE MANUTENÇÃO";
  stripTitle.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_SECONDARY } },
    font: { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  summarySheet.getRow(4).height = 30;

  // 3. DARK BG
  for (let r = 5; r <= 35; r++) {
    for (let c = 1; c <= 11; c++) {
      summarySheet.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };
    }
  }

  // 4. Logo
  try {
    const logoBase64 = await getLogoBase64();
    const logoId = workbook.addImage({ base64: logoBase64, extension: 'png' });
    summarySheet.addImage(logoId, {
      tl: { col: 4.8, row: 0.2 },
      ext: { width: 144, height: 48 }
    });
  } catch (e) { console.warn(e); }

  // --- KPI Cards (Row 6) ---
  const createCard = (col: string, row: number, title: string, value: string | number, color: string = BRAND_PRIMARY) => {
    const titleRef = `${col}${row}`;
    const valRef = `${col}${row + 1}`;

    summarySheet.getCell(titleRef).value = title;
    summarySheet.getCell(titleRef).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } },
      font: { name: 'Arial', size: 11, bold: true, color: { argb: BRAND_SECONDARY } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { top: { style: 'medium', color: { argb: color === 'red' ? 'FFEF4444' : (color === 'purple' ? 'FF9333EA' : BRAND_PRIMARY) } } }
    };

    const cellVal = summarySheet.getCell(valRef);
    cellVal.value = value;
    cellVal.style = {
      ...styles.dashboardValue,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } },
      font: { name: 'Arial', size: 22, bold: true, color: { argb: color === 'red' ? 'FFEF4444' : (color === 'purple' ? 'FF9333EA' : BRAND_PRIMARY) } }
    };
  };

  createCard('B', 6, "Total de Tarefas", totalTasks);
  createCard('D', 6, "Concluídas", completedTasks, 'FF16A34A');
  createCard('F', 6, "Pendentes", pendingTasks, 'FF9333EA');

  // Row 9
  createCard('B', 9, "Atrasadas", overdueTasks, 'red');
  createCard('D', 9, "Alta Prioridade", highPriority, 'red');
  createCard('F', 9, "Em Andamento", tasks.filter(t => t.status === 'em_andamento').length, 'FFFFD700'); // Gold

  // --- 2. Data Sheet (Relatório) ---
  const worksheet = workbook.addWorksheet("Relatório");

  const columns = [
    { header: "Título", key: "title", width: 30 },
    { header: "Ativo", key: "asset_name", width: 25 },
    { header: "Prioridade", key: "priority", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Vencimento", key: "due_date", width: 15 },
    { header: "Responsável", key: "assigned_to", width: 20 },
    { header: "Criado em", key: "created_at", width: 15 },
  ];

  // Headers & Styling (Reuse existing pattern)
  const lastColLetter = String.fromCharCode(65 + columns.length - 1);
  worksheet.mergeCells(`A1:${lastColLetter}2`);
  const headerTitle = worksheet.getCell('A1');
  headerTitle.value = "RELATÓRIO DE MANUTENÇÃO";
  headerTitle.style = { ...styles.title };

  worksheet.mergeCells(`A3:${lastColLetter}3`);
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `DAVUS SYSTEM | Gerado em: ${new Date().toLocaleString('pt-BR')}`;
  dateCell.style = {
    font: { name: 'Arial', size: 10, italic: true, color: { argb: BRAND_TEXT_LIGHT } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } }
  };

  worksheet.getRow(4).height = 5;
  for (let c = 1; c <= columns.length; c++) {
    worksheet.getRow(4).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_PRIMARY } };
  }

  const headerRow = worksheet.getRow(5);
  headerRow.height = 35;
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header.toUpperCase();
    cell.style = { ...styles.header };
    worksheet.getColumn(idx + 1).width = col.width;
  });

  worksheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: columns.length } };

  tasks.forEach((item: any, i) => {
    const rowIdx = 6 + i;
    const row = worksheet.getRow(rowIdx);
    row.getCell(1).value = item.title;
    row.getCell(2).value = item.asset_name;
    row.getCell(3).value = item.priority;
    row.getCell(4).value = item.status;
    row.getCell(5).value = item.due_date ? new Date(item.due_date).toLocaleDateString('pt-BR') : "";
    row.getCell(6).value = item.assigned_to;
    row.getCell(7).value = new Date(item.created_at).toLocaleDateString('pt-BR');

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.style = { ...styles.cell };
      if (rowIdx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    });
    row.commit();
  });

  // Conditional Formatting (Priority)
  const lastRow = 6 + tasks.length - 1;
  worksheet.addConditionalFormatting({
    ref: `C6:C${lastRow}`,
    rules: [
      { priority: 1, type: 'containsText', operator: 'containsText', text: 'urgente', style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } }, font: { color: { argb: 'FFEF4444' }, bold: true } } },
      { priority: 2, type: 'containsText', operator: 'containsText', text: 'alta', style: { font: { color: { argb: 'FFEF4444' } } } },
    ]
  });

  // Add Signature Area
  addSignatureArea(worksheet, lastRow);

  // Add Metadata
  addMetadataSheet(workbook, "Supervisor de Manutenção");

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${filename}.xlsx`);
}

async function exportOverviewXLSX(products: Product[], assets: Asset[], tasks: MaintenanceTask[], filename: string) {
  const workbook = new ExcelJS.Workbook();
  const today = new Date();

  // Calculate all metrics
  const totalStockValue = products.reduce((acc, p) => acc + (p.quantity * (p.unit_price || 0)), 0);
  const totalAssetValue = assets.reduce((acc, a) => acc + (a.value || 0), 0);
  const lowStockItems = products.filter(p => p.quantity < (p.min_stock || 0));
  const criticalStock = products.filter(p => p.quantity === 0);
  const pendingMaintenance = tasks.filter(t => t.status !== 'concluido').length;
  const overdueMaintenance = tasks.filter(t => t.status !== 'concluido' && t.due_date && new Date(t.due_date) < today).length;
  const assetsInMaintenance = assets.filter(a => a.condition === "Manutenção").length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyMovements = 0; // Would need movements data

  const topProducts = [...products]
    .map(p => ({ ...p, totalValue: p.quantity * (p.unit_price || 0) }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  const topAssets = [...assets]
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 5);

  // --- 1. Dashboard Sheet ---
  const summarySheet = workbook.addWorksheet("Dashboard Gerencial", { views: [{ showGridLines: false }] });

  // Header Background
  summarySheet.mergeCells('A1:K3');
  summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };

  // Title
  summarySheet.mergeCells('A4:K4');
  const stripTitle = summarySheet.getCell('A4');
  stripTitle.value = "RELATÓRIO GERENCIAL";
  stripTitle.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_SECONDARY } },
    font: { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  summarySheet.getRow(4).height = 30;

  // Dark background for card area
  for (let r = 5; r <= 15; r++) {
    for (let c = 1; c <= 11; c++) {
      summarySheet.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } };
    }
  }

  // Logo
  try {
    const logoBase64 = await getLogoBase64();
    const logoId = workbook.addImage({ base64: logoBase64, extension: 'png' });
    summarySheet.addImage(logoId, { tl: { col: 4.8, row: 0.2 }, ext: { width: 144, height: 48 } });
  } catch (e) { console.warn(e); }

  // KPI Cards (8 cards total: 2 rows x 4 columns)
  const createCard = (col: string, row: number, title: string, value: string | number, isCurrency = false, color: string = BRAND_PRIMARY) => {
    const titleRef = `${col}${row}`;
    const valRef = `${col}${row + 1}`;

    summarySheet.getCell(titleRef).value = title;
    summarySheet.getCell(titleRef).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } },
      font: { name: 'Arial', size: 11, bold: true, color: { argb: BRAND_SECONDARY } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { top: { style: 'medium', color: { argb: color === 'red' ? 'FFEF4444' : color === 'green' ? 'FF22C55E' : BRAND_PRIMARY } } }
    };

    const cellVal = summarySheet.getCell(valRef);
    cellVal.value = value;
    cellVal.style = {
      ...styles.dashboardValue,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_CARD_BG } },
      font: { name: 'Arial', size: 22, bold: true, color: { argb: color === 'red' ? 'FFEF4444' : color === 'green' ? 'FF22C55E' : BRAND_PRIMARY } }
    };
    if (isCurrency) cellVal.numFmt = '"R$" #,##0.00';
  };

  // Row 1
  createCard('B', 6, "Valor em Estoque", totalStockValue, true);
  createCard('D', 6, "Valor Patrimonial", totalAssetValue, true);
  createCard('F', 6, "Total Investido", totalStockValue + totalAssetValue, true, 'green');
  createCard('H', 6, "Montly Movements", monthlyMovements);

  // Row 2
  createCard('B', 9, "Estoque Baixo", lowStockItems.length, false, 'red');
  createCard('D', 9, "Estoque Crítico", criticalStock.length, false, 'red');
  createCard('F', 9, "Manutenção Pendente", pendingMaintenance);
  createCard('H', 9, "Em Manutenção", assetsInMaintenance);

  // Column widths
  summarySheet.getColumn('A').width = 2;
  summarySheet.getColumn('B').width = 25;
  summarySheet.getColumn('C').width = 5;
  summarySheet.getColumn('D').width = 25;
  summarySheet.getColumn('E').width = 5;
  summarySheet.getColumn('F').width = 25;
  summarySheet.getColumn('G').width = 5;
  summarySheet.getColumn('H').width = 25;

  // Top 5 Products Table
  let startRow = 18;
  summarySheet.mergeCells(`B${startRow}:H${startRow}`);
  const topProductsTitle = summarySheet.getCell(`B${startRow}`);
  topProductsTitle.value = "TOP 5 PRODUTOS MAIS VALIOSOS";
  topProductsTitle.style = {
    font: { name: 'Arial', size: 14, bold: true, color: { argb: BRAND_PRIMARY } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } }
  };

  const productHeaderRow = summarySheet.getRow(startRow + 1);
  productHeaderRow.height = 30;
  ['Produto', 'Categoria', 'Qtd', 'V. Unit', 'Total'].forEach((h, idx) => {
    const cell = productHeaderRow.getCell(idx + 2); // Start at column B
    cell.value = h.toUpperCase();
    cell.style = { ...styles.header };
  });

  topProducts.forEach((p, i) => {
    const rowIdx = startRow + 2 + i;
    const row = summarySheet.getRow(rowIdx);
    row.getCell(2).value = p.name;
    row.getCell(3).value = p.category;
    row.getCell(4).value = p.quantity;
    row.getCell(5).value = p.unit_price || 0;
    row.getCell(6).value = p.totalValue;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      cell.style = { ...styles.cell };
      if (colNumber >= 4) cell.numFmt = colNumber === 5 || colNumber === 6 ? '"R$" #,##0.00' : '0';
    });
    row.commit();
  });

  // Top 5 Assets Table
  startRow += topProducts.length + 4;
  summarySheet.mergeCells(`B${startRow}:H${startRow}`);
  const topAssetsTitle = summarySheet.getCell(`B${startRow}`);
  topAssetsTitle.value = "TOP 5 ATIVOS MAIS VALIOSOS";
  topAssetsTitle.style = {
    font: { name: 'Arial', size: 14, bold: true, color: { argb: BRAND_PRIMARY } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } }
  };

  const assetHeaderRow = summarySheet.getRow(startRow + 1);
  assetHeaderRow.height = 30;
  ['Código', 'Nome', 'Categoria', 'Valor'].forEach((h, idx) => {
    const cell = assetHeaderRow.getCell(idx + 2);
    cell.value = h.toUpperCase();
    cell.style = { ...styles.header };
  });

  topAssets.forEach((a, i) => {
    const rowIdx = startRow + 2 + i;
    const row = summarySheet.getRow(rowIdx);
    row.getCell(2).value = a.code;
    row.getCell(3).value = a.name;
    row.getCell(4).value = a.category;
    row.getCell(5).value = a.value || 0;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      cell.style = { ...styles.cell };
      if (colNumber === 5) cell.numFmt = '"R$" #,##0.00';
    });
    row.commit();
  });

  // --- 2. Alerts Sheet ---
  const alertsSheet = workbook.addWorksheet("Alertas");

  // Header
  const lastColLetter = 'F';
  alertsSheet.mergeCells(`A1:${lastColLetter}2`);
  const headerTitle = alertsSheet.getCell('A1');
  headerTitle.value = "ALERTAS DO SISTEMA";
  headerTitle.style = { ...styles.title };

  alertsSheet.mergeCells(`A3:${lastColLetter}3`);
  const dateCell = alertsSheet.getCell('A3');
  dateCell.value = `DAVUS SYSTEM | Gerado em: ${new Date().toLocaleString('pt-BR')}`;
  dateCell.style = {
    font: { name: 'Arial', size: 10, italic: true, color: { argb: BRAND_TEXT_LIGHT } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } }
  };

  alertsSheet.getRow(4).height = 5;
  for (let c = 1; c <= 6; c++) {
    alertsSheet.getRow(4).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_PRIMARY } };
  }

  // Critical Stock Section (Esgotados)
  let alertRow = 5;
  if (criticalStock.length > 0) {
    alertsSheet.mergeCells(`A${alertRow}:F${alertRow}`);
    const criticalTitle = alertsSheet.getCell(`A${alertRow}`);
    criticalTitle.value = "ESTOQUE CRÍTICO (ESGOTADOS)";
    criticalTitle.style = {
      font: { name: 'Arial', size: 14, bold: true, color: { argb: 'FFEF4444' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } }
    };

    const criticalHeaderRow = alertsSheet.getRow(alertRow + 1);
    criticalHeaderRow.height = 35;
    ['Produto', 'SKU', 'Categoria', 'Local', '', ''].forEach((h, idx) => {
      if (h) {
        const cell = criticalHeaderRow.getCell(idx + 1);
        cell.value = h.toUpperCase();
        cell.style = { ...styles.header, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } } };
      }
    });

    criticalStock.forEach((p, i) => {
      const rowIdx = alertRow + 2 + i;
      const row = alertsSheet.getRow(rowIdx);
      row.getCell(1).value = p.name;
      row.getCell(2).value = p.sku;
      row.getCell(3).value = p.category;
      row.getCell(4).value = p.location;

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.style = { ...styles.cell };
        if (rowIdx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEECEC' } };
      });
      row.commit();
    });

    alertRow += criticalStock.length + 4;
  }

  // Low Stock Section
  const headerRow = alertsSheet.getRow(alertRow);
  headerRow.height = 35;
  ['Produto', 'SKU', 'Categoria', 'Qtd Atual', 'Qtd Mínima', 'Deficit'].forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h.toUpperCase();
    cell.style = { ...styles.header };
  });

  alertsSheet.getColumn(1).width = 35;
  alertsSheet.getColumn(2).width = 15;
  alertsSheet.getColumn(3).width = 20;
  alertsSheet.getColumn(4).width = 12;
  alertsSheet.getColumn(5).width = 12;
  alertsSheet.getColumn(6).width = 12;

  lowStockItems.forEach((p, i) => {
    const rowIdx = alertRow + 1 + i;
    const row = alertsSheet.getRow(rowIdx);
    row.getCell(1).value = p.name;
    row.getCell(2).value = p.sku;
    row.getCell(3).value = p.category;
    row.getCell(4).value = p.quantity;
    row.getCell(5).value = p.min_stock;
    row.getCell(6).value = (p.min_stock || 0) - p.quantity;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.style = { ...styles.cell };
      if (rowIdx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      if (colNumber >= 4) cell.alignment = { horizontal: 'right' };
    });
    row.commit();
  });

  // Overdue Maintenance Section
  const maintenanceStartRow = alertRow + lowStockItems.length + 3;
  alertsSheet.mergeCells(`A${maintenanceStartRow}:F${maintenanceStartRow}`);
  const maintenanceTitle = alertsSheet.getCell(`A${maintenanceStartRow}`);
  maintenanceTitle.value = "MANUTENÇÕES ATRASADAS";
  maintenanceTitle.style = {
    font: { name: 'Arial', size: 14, bold: true, color: { argb: BRAND_PRIMARY } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK_BG } }
  };

  const maintenanceHeaderRow = alertsSheet.getRow(maintenanceStartRow + 1);
  maintenanceHeaderRow.height = 35;
  ['Tarefa', 'Ativo', 'Prioridade', 'Status', 'Vencimento', 'Responsável'].forEach((h, idx) => {
    const cell = maintenanceHeaderRow.getCell(idx + 1);
    cell.value = h.toUpperCase();
    cell.style = { ...styles.header };
  });

  const overdueTasks = tasks.filter(t => t.status !== 'concluido' && t.due_date && new Date(t.due_date) < today);
  overdueTasks.forEach((t, i) => {
    const rowIdx = maintenanceStartRow + 2 + i;
    const row = alertsSheet.getRow(rowIdx);
    row.getCell(1).value = t.title;
    row.getCell(2).value = t.asset_name;
    row.getCell(3).value = t.priority;
    row.getCell(4).value = t.status;
    row.getCell(5).value = t.due_date;
    row.getCell(6).value = t.assigned_to;

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.style = { ...styles.cell };
      if (rowIdx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    });
    row.commit();
  });

  // Add Metadata
  addMetadataSheet(workbook, "Gestor Executivo");

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${filename}.xlsx`);
}

// --- Main Export Callers ---

export function exportProducts(products: Product[], format: "csv" | "json" | "xlsx"): void {
  const filename = `produtos_${new Date().toISOString().split("T")[0]}`;
  if (format === "json") return exportToJSON(products, filename);
  if (format === "xlsx") return void exportProductsXLSX(products, filename);
  exportToCSV(products, filename, [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Nome" },
    { key: "category", label: "Categoria" },
    { key: "quantity", label: "Quantidade" },
    { key: "min_stock", label: "Estoque Mín" },
    { key: "max_stock", label: "Estoque Máx" },
    { key: "location", label: "Local" },
    { key: "unit_price", label: "Preço Unit." },
    { key: "last_updated", label: "Atualização" },
  ]);
}

export function exportAssets(assets: Asset[], format: "csv" | "json" | "xlsx"): void {
  const filename = `patrimonios_${new Date().toISOString().split("T")[0]}`;
  if (format === "json") return exportToJSON(assets, filename);
  if (format === "xlsx") return void exportAssetsXLSX(assets, filename);
  exportToCSV(assets, filename, [
    { key: "code", label: "Código" },
    { key: "name", label: "Nome" },
    { key: "category", label: "Categoria" },
    { key: "location", label: "Local" },
    { key: "condition", label: "Estado" },
    { key: "responsible", label: "Responsável" },
    { key: "value", label: "Valor" },
    { key: "acquisition_date", label: "Data Aquisição" },
  ]);
}

export function exportMaintenance(tasks: MaintenanceTask[], format: "csv" | "json" | "xlsx"): void {
  const filename = `manutencao_${new Date().toISOString().split("T")[0]}`;
  if (format === "json") return exportToJSON(tasks, filename);
  if (format === "xlsx") return void exportMaintenanceXLSX(tasks, filename);
  exportToCSV(tasks, filename, [
    { key: "title", label: "Título" },
    { key: "asset_name", label: "Ativo" },
    { key: "priority", label: "Prioridade" },
    { key: "status", label: "Status" },
    { key: "due_date", label: "Vencimento" },
    { key: "assigned_to", label: "Responsável" },
  ]);
}

export function exportOverview(products: Product[], assets: Asset[], tasks: MaintenanceTask[], format: 'xlsx'): void {
  const filename = `relatorio_gerencial_${new Date().toISOString().split("T")[0]}`;
  return void exportOverviewXLSX(products, assets, tasks, filename);
}


// --- Generic Helpers ---

export function exportToJSON<T>(data: T[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  downloadBlob(blob, `${filename}.json`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV<T extends object>(data: T[], filename: string, headers: { key: keyof T; label: string }[]): void {
  const headerRow = headers.map((h) => h.label).join(",");
  const rows = data.map((item) =>
    headers.map((h) => {
      const value = (item as any)[h.key];
      if (value === null || value === undefined) return "";
      if (typeof value === "string" && value.includes(",")) return `"${value}"`;
      return String(value);
    }).join(",")
  );
  const csv = [headerRow, ...rows].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportMovements(movements: StockMovement[], format: "csv" | "json"): void {
  const filename = `movimentacoes_${new Date().toISOString().split("T")[0]}`;
  if (format === "json") return exportToJSON(movements, filename);
  exportToCSV(movements, filename, [
    { key: "date", label: "Data" },
    { key: "product_name", label: "Produto" },
    { key: "type", label: "Tipo" },
    { key: "quantity", label: "Quantidade" },
    { key: "reason", label: "Motivo" },
    { key: "user_name", label: "Usuário" },
    { key: "cost_center", label: "Centro de Custo" },
  ]);
}

export function exportCheckouts(checkouts: Checkout[], format: "csv" | "json"): void {
  const filename = `checkouts_${new Date().toISOString().split("T")[0]}`;
  if (format === "json") return exportToJSON(checkouts, filename);
  exportToCSV(checkouts, filename, [
    { key: "checkout_date", label: "Data Retirada" },
    { key: "item_name", label: "Item" },
    { key: "item_type", label: "Tipo" },
    { key: "quantity", label: "Quantidade" },
    { key: "user_name", label: "Usuário" },
    { key: "status", label: "Status" },
    { key: "expected_return", label: "Previsão Devolução" },
    { key: "return_date", label: "Data Devolução" },
  ]);
}
