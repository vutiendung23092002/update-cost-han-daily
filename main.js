import { getAllCostMap } from "./src/services/kiot/get-all-cost-map.js";
import { createLarkClient } from "./src/core/larkbase-client.js";
import { env } from "./src/config/env.js";
import * as larkbaseService from "./src/services/larkbase/index.js";
import * as utils from "./src/utils/index.js";

async function syncCostTiktokHanDaily(baseId, tableName, from, to) {
  const {
    newMap: newCostMap,
    oldMap: oldCostMap,
    merged: mergedCostRaw,
  } = await getAllCostMap();

  // Convert toàn bộ SKU về lowercase
  const mergedCost = Object.fromEntries(
    Object.entries(mergedCostRaw).map(([sku, cost]) => [
      sku.toLowerCase(),
      cost,
    ])
  );

  // utils.writeJsonFile("./src/data/kiot_cost_merged.json", mergedCost);

  const larkClient = await createLarkClient(
    env.LARK.tiktok_k_orders_items.app_id,
    env.LARK.tiktok_k_orders_items.app_secret
  );

  // Kiểm tra bảng
  const listTb = await larkbaseService.getListTable(larkClient, baseId);
  const table = listTb?.data?.items?.find((t) => t.name === tableName);
  let tableId;

  if (table) {
    console.log(`[LARK] Bảng '${tableName}' đã tồn tại.`);
    tableId = table.table_id;
  } else {
    console.log(`[LARK] Bảng '${tableName}' không tồn tại.`);
    return; // Nếu bảng ko tồn tại thì dừng
  }
  console.log("[LARK] Table id:", tableId);

  const existingRecords = await larkbaseService.searchLarkRecordsFilterDate(
    larkClient,
    baseId,
    tableId,
    1000,
    "create_time",
    from,
    to
  );

  console.log(`[LARK] Đã lấy ${existingRecords.length} bản ghi.`);

  const updatePayload = [];

  for (const rec of existingRecords) {
    const sku = rec.fields?.sku?.toLowerCase();

    if (!sku) continue; // Ko có SKU -> next

    const currentCost = rec.fields?.["Giá vốn"]; // giá vốn đang nằm trong bảng Lark
    const newCost = mergedCost[sku]; // giá vốn từ Kiot

    // Nếu giá vốn hiện tại đã có số (khác 0, khác null, khác undefined) thì bỏ qua
    if (
      currentCost !== 0 &&
      currentCost !== null &&
      currentCost !== undefined
    ) {
      continue;
    }

    // Nếu giá vốn từ Kiot ko tồn tại hoặc undefined thì cũng bỏ
    if (newCost === undefined || newCost === null) {
      continue;
    }

    updatePayload.push({
      record_id: rec.record_id,
      fields: {
        "Giá vốn": newCost,
      },
    });
  }

  console.log("Số record cần update:", updatePayload.length);

  await larkbaseService.updateLarkRecords(
    larkClient,
    baseId,
    tableId,
    updatePayload
  );
}

const baseId = process.env.LARK_BASE_ID;
const tableName = process.env.LARK_TABLE_NAME;
const from = process.env.FROM ? `${process.env.FROM} 00:00:00` : null;
const to = process.env.TO ? `${process.env.TO} 23:59:59` : null;

const ONE_DAY = 24 * 60 * 60 * 1000;
const timestampFrom = utils.vnTimeToUTCTimestampMiliseconds(from) - ONE_DAY;
const timestampTo = utils.vnTimeToUTCTimestampMiliseconds(to) + ONE_DAY;

syncCostTiktokHanDaily(baseId, tableName, timestampFrom, timestampTo);
