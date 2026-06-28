/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LockServiceWrapper.gs
 * Provides transactional thread-safe lock helpers to prevent write conflicts.
 */

var LockServiceWrapper = {
  /**
   * Executes a callback function inside an exclusive script lock.
   * @param {number} timeoutMs - Maximum wait time for lock in milliseconds.
   * @param {Function} callback - The function to run within the lock.
   * @return {*} The result of the callback function.
   */
  runWithLock: function(timeoutMs, callback) {
    var lock = LockService.getScriptLock();
    var success = false;
    try {
      success = lock.tryLock(timeoutMs || 10000);
    } catch (e) {
      throw new Error("Lock acquisition error: " + e.message);
    }
    
    if (!success) {
      throw new Error("Could not acquire exclusive database write lock within " + (timeoutMs / 1000) + " seconds. Please retry your action.");
    }
    
    try {
      return callback();
    } finally {
      lock.releaseLock();
    }
  }
};
