import { Request, Response } from 'express';
import { db } from '../utils/db';
import { get } from 'lodash';
import { stat } from 'fs';

export class MonitoringController {
  // Fungsi untuk mendapatkan status berdasarkan waktu created_at
  private getStatus(createdAt: string): string {
    const now = new Date();
    const createdDate = new Date(createdAt);

    // Validasi format tanggal
    if (isNaN(createdDate.getTime())) {
      console.error(`Invalid date format: ${createdAt}`);
      return 'mati';
    }

    const minutesDifference =
      (now.getTime() - createdDate.getTime()) / (1000 * 60);
    return minutesDifference > 5 ? 'mati' : 'hidup';
  }
  private getStatus2(createdAt: string): string {
    const now = new Date();
    const createdDate = new Date(createdAt);

    // Validasi format tanggal
    if (isNaN(createdDate.getTime())) {
      console.error(`Invalid date format: ${createdAt}`);
      return 'mati';
    }

    const minutesDifference =
      (now.getTime() - createdDate.getTime()) / (1000 * 60);
    return minutesDifference.toString();
  }

  // Fungsi untuk mengambil data monitoring berdasarkan UUID
  public async handlerMonitoring(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { uuid } = req.params;

    if (!uuid) {
      return res.status(400).json({ error: 'UUID parameter is required' });
    }

    try {
      // Query untuk mengambil data sensor berdasarkan UUID dengan memastikan format timestamp benar
      const query = `
                SELECT uuid, station_id, time, temperature, do_, tur, ct, ph, orp, bod,
                       cod, tss, n, no2, no3_3, depth, pump_status, cv_status, read_status,
                       created_at::timestamptz AS created_at
                FROM sensor_data
                WHERE uuid = $1
                ORDER BY created_at DESC
                LIMIT 1;
            `;

      const result = await db.query(query, [uuid]);

      const countQuery = `
                SELECT jumlah_sensor
                FROM station
                WHERE uuid = $1;
            `;
      const countResult = await db.query(countQuery, [uuid]);
      const jumlahSensor = countResult.rows[0].jumlah_sensor;
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Data not found for the provided UUID' });
      }

      const data = result.rows[0];
      const status = this.getStatus(data.created_at);
      const status2 = this.getStatus2(data.created_at);

      console.log('Data fetched successfully:', status2);

      // Mengembalikan response JSON yang valid
      return res.json({
        ...data,
        status,
        jumlah_sensor: jumlahSensor,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Fungsi untuk mengecek status secara real-time
  public async handlerRealTimeStatus(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { uuid } = req.params;

    if (!uuid) {
      return res.status(400).json({ error: 'UUID parameter is required' });
    }

    try {
      // Ambil data terbaru berdasarkan UUID
      const query = `
                SELECT created_at::timestamptz AS created_at
                FROM sensor_data
                WHERE uuid = $1
                ORDER BY created_at DESC
                LIMIT 1;
            `;
      const result = await db.query(query, [uuid]);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Data not found for the provided UUID' });
      }

      const { created_at } = result.rows[0];
      const status = this.getStatus(created_at);

      return res.json({
        uuid,
        status,
      });
    } catch (error) {
      console.error('Error checking real-time status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
