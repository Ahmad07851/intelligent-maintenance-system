/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AttachmentService.gs
 * Tracks attachment metadata linked to specific Work Orders.
 */

var AttachmentService = {
  /**
   * Registers attachment metadata.
   */
  addAttachment: function(payload, actor) {
    if (!payload.workOrderId || !payload.fileName || !payload.driveUrl) {
      throw new Error("Missing required attachment metadata parameters (workOrderId, fileName, driveUrl).");
    }

    var id = "ATT-" + new Date().getTime() + "-" + Math.floor(1000 + Math.random() * 9000);
    var newFile = {
      id: id,
      workOrderId: payload.workOrderId,
      fileName: payload.fileName.trim(),
      fileSize: Number(payload.fileSize || 0),
      fileType: payload.fileType || "application/octet-stream",
      driveUrl: payload.driveUrl,
      createdAt: new Date().toISOString(),
      createdBy: actor.email
    };

    var result = SheetService.insert(CONFIG.SHEETS.WO_FILES, newFile);

    // Save historical log of files uploaded
    WorkOrderWorkflowService.logHistory(
      payload.workOrderId, 
      "UPLOAD_FILE", 
      "", 
      "", 
      actor, 
      "Uploaded file: " + payload.fileName
    );

    return result;
  }
};
