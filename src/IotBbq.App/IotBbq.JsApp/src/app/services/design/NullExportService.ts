import { IExportService } from '../contracts/IExportService';

export class NullExportService implements IExportService {
  public async exportData(eventId: string): Promise<void> {
    console.log(`Export EventId: ${eventId}`);
  }
}