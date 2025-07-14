import { WalkLog } from '../types/Weather';

export class StorageService {
  private static readonly WALK_LOGS_KEY = 'walkLogs';
  
  static saveWalkLog(log: WalkLog): void {
    try {
      const logs = this.getWalkLogs();
      logs.push(log);
      
      // Keep only last 50 logs
      const recentLogs = logs.slice(-50);
      
      const appSettings = require('@nativescript/core').ApplicationSettings;
      appSettings.setString(this.WALK_LOGS_KEY, JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to save walk log:', error);
    }
  }
  
  static getWalkLogs(): WalkLog[] {
    try {
      const appSettings = require('@nativescript/core').ApplicationSettings;
      const logsJson = appSettings.getString(this.WALK_LOGS_KEY, '[]');
      const logs = JSON.parse(logsJson);
      
      // Convert date strings back to Date objects
      return logs.map((log: any) => ({
        ...log,
        date: new Date(log.date)
      }));
    } catch (error) {
      console.error('Failed to load walk logs:', error);
      return [];
    }
  }
  
  static clearWalkLogs(): void {
    try {
      const appSettings = require('@nativescript/core').ApplicationSettings;
      appSettings.remove(this.WALK_LOGS_KEY);
    } catch (error) {
      console.error('Failed to clear walk logs:', error);
    }
  }
}