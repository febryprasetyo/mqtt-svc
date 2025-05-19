import * as Mqtt from 'mqtt';
import { db } from '../utils/db';
import dotenv from 'dotenv';
import log4js from 'log4js';
import chalk from 'chalk';

dotenv.config();

const logger = log4js.getLogger('mqtt');

const brokerUrl = process.env.MQTT_BROKER_URL;
const options = {
  port: parseInt(process.env.MQTT_PORT || '1883'),
  keepalive: parseInt(process.env.MQTT_KEEP_ALIVE || '60'),
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
};

const subtopic = process.env.MQTT_TOPIC || '#';
class MqttHandler {
  public mqttClient: Mqtt.MqttClient | null = null;

  async connect() {
    if (!brokerUrl) {
      throw new Error(
        'MQTT_BROKER_URL is not defined in the environment variables'
      );
    }

    this.mqttClient = Mqtt.connect(brokerUrl, options);

    this.mqttClient.on('connect', () => {
      console.log('MQTT connected');
      this.mqttClient?.subscribe(subtopic, (err: Error | null) => {
        if (err) console.error('Subscribe error:', err);
      });
    });

    this.mqttClient.on('message', async (topic: string, message: Buffer) => {
      try {
        // Removed as 'req' is not defined in this context
        const payload = JSON.parse(message.toString());
        const { uuid, data } = payload;

        if (!uuid || !Array.isArray(data) || data.length === 0) {
          console.warn('Invalid payload format');
          return;
        }

        const latestData = data[data.length - 1]; // Ambil data paling akhir

        // Cek nama station dari tabel stations
        const stationQuery = `SELECT station_id FROM station WHERE uuid = $1`;
        const stationResult = await db.query(stationQuery, [uuid]);
        const station =
          stationResult.rows[0]?.station_id || 'station not found';

        const toFixed2 = (x: number) => parseFloat(x.toFixed(2));

        const insertQuery = `
      INSERT INTO sensor_data (
        uuid, station_id, time, temperature, do_, tur, ct, ph, orp, bod,
        cod, tss, n, no2, no3_3, depth, pump_status, cv_status, read_status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW()
      )
      ON CONFLICT (uuid) DO UPDATE SET
        station_id = EXCLUDED.station_id,
        time = EXCLUDED.time,
        temperature = EXCLUDED.temperature,
        do_ = EXCLUDED.do_,
        tur = EXCLUDED.tur,
        ct = EXCLUDED.ct,
        ph = EXCLUDED.ph,
        orp = EXCLUDED.orp,
        bod = EXCLUDED.bod,
        cod = EXCLUDED.cod,
        tss = EXCLUDED.tss,
        n = EXCLUDED.n,
        no2 = EXCLUDED.no2,
        no3_3 = EXCLUDED.no3_3,
        depth = EXCLUDED.depth,
        pump_status = EXCLUDED.pump_status,
        cv_status = EXCLUDED.cv_status,
        read_status = EXCLUDED.read_status,
        created_at = NOW();
    `;

        const values = [
          uuid,
          station,
          latestData.time,
          toFixed2(latestData.Temperature),
          toFixed2(latestData.DO),
          toFixed2(latestData.TUR),
          toFixed2(latestData.CT),
          toFixed2(latestData.PH),
          toFixed2(latestData.ORP),
          toFixed2(latestData.BOD),
          toFixed2(latestData.COD),
          toFixed2(latestData.TSS),
          toFixed2(latestData.N),
          toFixed2(latestData.NO2),
          toFixed2(latestData['NO3-3']),
          toFixed2(latestData.DEPTH),
          latestData.Pump_Status,
          latestData.CV_Status,
          latestData.Read_Status,
        ];

        await db.query(insertQuery, values);
        const logMessage = `${chalk.green.bold('✔')} ${chalk.cyan(
          'Data updated'
        )} | ID: ${chalk.yellow(uuid)} | Station: ${chalk.magenta(station)}`;
        console.log(logMessage);
      } catch (err) {
        logger.error('Error handling MQTT message:', err);
      }
    });
  }
}

export = MqttHandler;
