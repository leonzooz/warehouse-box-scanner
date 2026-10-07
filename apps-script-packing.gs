var PACKING_MODELS = ["S60", "S77", "S105", "S120", "S150"];
var PACKING_SHEET_NAME = "包貨面籤";
var PACKING_STATS_SHEET_NAME = "倉庫紙箱統計";
var PACKING_PHOTO_FOLDER_NAME = "PackingFaceLabels";

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};

  if (params.action === "packingStats") {
    return packingStats_();
  }

  return jsonOutput_({ status: "success", service: "packing" });
}

function doPost(e) {
  var params = e && e.parameter ? e.parameter : {};

  if (params.mode !== "packing") {
    return jsonOutput_({ status: "error", message: "Only packing uploads are accepted" });
  }

  return handlePackingUpload_(params);
}

function handlePackingUpload_(params) {
  try {
    var boxModel = String(params.boxModel || "").trim().toUpperCase();
    var photoData = String(params.photoData || "");
    var operatorName = String(params.operatorName || params.operator || "").trim() || "未填寫";

    if (PACKING_MODELS.indexOf(boxModel) === -1) {
      throw new Error("紙箱型號不正確：" + boxModel);
    }

    if (!photoData) {
      throw new Error("缺少面籤照片");
    }

    var now = new Date();
    var base64 = photoData.indexOf(",") !== -1 ? photoData.split(",")[1] : photoData;
    var photoName = params.photoName || ("packing-" + boxModel + "-" + now.getTime() + ".jpg");
    var blob = Utilities.newBlob(Utilities.base64Decode(base64), "image/jpeg", photoName);
    var file = getPackingPhotoFolder_().createFile(blob);
    var sheet = getPackingSheet_();

    ensurePackingHeaders_(sheet);
    sheet.appendRow([
      now,
      boxModel,
      file.getUrl(),
      file.getId(),
      params.scanTime || Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss"),
      "已拍面籤",
      "packing",
      operatorName
    ]);

    refreshPackingBoxStats_();

    return jsonOutput_({
      status: "success",
      boxModel: boxModel,
      photoUrl: file.getUrl(),
      photoFileId: file.getId()
    });
  } catch (error) {
    return jsonOutput_({ status: "error", message: error.toString() });
  }
}

function getPackingPhotoFolder_() {
  var folders = DriveApp.getFoldersByName(PACKING_PHOTO_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(PACKING_PHOTO_FOLDER_NAME);
}

function getPackingSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PACKING_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(PACKING_SHEET_NAME);
  }

  return sheet;
}

function ensurePackingHeaders_(sheet) {
  var headers = [
    "時間戳記",
    "紙箱型號",
    "面籤照片URL",
    "面籤照片FileID",
    "掃描時間",
    "狀態",
    "來源",
    "上傳人"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return;
  }

  var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];

  for (var i = 0; i < headers.length; i++) {
    if (!existing[i]) {
      sheet.getRange(1, i + 1).setValue(headers[i]);
    }
  }
}

function refreshPackingBoxStats_() {
  var packingSheet = getPackingSheet_();
  var stats = {};
  var timezone = Session.getScriptTimeZone();
  var today = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd");
  var i;

  for (i = 0; i < PACKING_MODELS.length; i++) {
    stats[PACKING_MODELS[i]] = { today: 0, total: 0, latest: "" };
  }

  if (packingSheet.getLastRow() > 1) {
    var rows = packingSheet.getRange(2, 1, packingSheet.getLastRow() - 1, 2).getValues();

    for (i = 0; i < rows.length; i++) {
      var timestamp = rows[i][0];
      var model = String(rows[i][1] || "").trim().toUpperCase();

      if (!stats[model]) {
        continue;
      }

      stats[model].total++;

      if (timestamp instanceof Date) {
        if (Utilities.formatDate(timestamp, timezone, "yyyy-MM-dd") === today) {
          stats[model].today++;
        }

        if (!stats[model].latest || timestamp.getTime() > stats[model].latest.getTime()) {
          stats[model].latest = timestamp;
        }
      }
    }
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var statsSheet = ss.getSheetByName(PACKING_STATS_SHEET_NAME);

  if (!statsSheet) {
    statsSheet = ss.insertSheet(PACKING_STATS_SHEET_NAME);
  }

  var output = [["統計日期", "紙箱型號", "今日使用數", "累計使用數", "最後上傳時間"]];

  for (i = 0; i < PACKING_MODELS.length; i++) {
    var box = PACKING_MODELS[i];
    output.push([today, box, stats[box].today, stats[box].total, stats[box].latest]);
  }

  statsSheet.clearContents();
  statsSheet.getRange(1, 1, output.length, output[0].length).setValues(output);
  statsSheet.getRange(1, 1, 1, output[0].length).setFontWeight("bold");
  statsSheet.setFrozenRows(1);
  statsSheet.autoResizeColumns(1, output[0].length);

  return stats;
}

function packingStats_() {
  try {
    var stats = refreshPackingBoxStats_();
    var items = [];

    for (var i = 0; i < PACKING_MODELS.length; i++) {
      var model = PACKING_MODELS[i];
      items.push({
        model: model,
        todayUsed: stats[model].today,
        totalUsed: stats[model].total,
        latestUpload: stats[model].latest
      });
    }

    return jsonOutput_({ status: "success", items: items });
  } catch (error) {
    return jsonOutput_({ status: "error", message: error.toString() });
  }
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
