// tslint:disable-next-line: no-var-requires
const bleno: typeof import("bleno") = require("@abandonware/bleno");

import { Utils } from "../../Utils";
import { IBluetoothServer } from "../contracts/IBluetoothServer";
import { LoggerService } from "../LoggerService";
import { ProbeSelectCharacteristic } from "../ProbeSelectCharacteristic";
import { TemperatureCharacteristic } from "../TemperatureCharacteristic";
import { ThermometerService } from "../ThermometerService";

const CALCULATOR_SERVICE_UUID = "00010000-89BD-43C8-9231-40F6E305F96D";

export class BluetoothPeripheral implements IBluetoothServer {

    private probeNumber = 0;

    constructor(private logger: LoggerService, private thermometerService: ThermometerService) {
        // some diagnostics
        bleno.on("stateChange", (state) => this.logger.log(`Bleno: Adapter changed state to ${state}`));

        bleno.on("advertisingStart", (err) => this.logger.log("Bleno: advertisingStart"));
        bleno.on("advertisingStartError", (err) => this.logger.log("Bleno: advertisingStartError"));
        // bleno.on("advertisingStop", (err) => console.log("Bleno: advertisingStop"));

        bleno.on("servicesSet", (err) => this.logger.log("Bleno: servicesSet"));
        bleno.on("servicesSetError", (err) => this.logger.log("Bleno: servicesSetError"));

        bleno.on("accept", (clientAddress) => this.logger.log(`Bleno: accept ${clientAddress}`));
        bleno.on("disconnect", (clientAddress) => this.logger.log(`Bleno: disconnect ${clientAddress}`));
    }

    public async powerOn(): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            if (bleno.state === "poweredOn") {
                return Promise.resolve();
            }

            // Start a timer to wait on the new state
            Utils.delay(5000).then(() => reject(new Error("Starting the device failed.")));

            try {
                bleno.on("stateChange", (state) => {
                    this.logger.log(`State change ${state}`);
                    if (state === "poweredOn") {
                        return resolve();
                    } else {
                        return reject(new Error(`State changed to ${state}`));
                    }
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

    public async startAdvertising(): Promise<void> {
        const uuid = CALCULATOR_SERVICE_UUID;
        const name = "Hamdallv2 Remote";

        return new Promise((resolve, reject) => {
            bleno.startAdvertising(name, [ uuid ], (error) => {
                if (error) {
                    return reject(error);
                } else {
                    return resolve();
                }
            });
        });
    }

    public async registerPrimaryService(): Promise<void> {

        const probeSelect = new ProbeSelectCharacteristic((value) => this.probeNumber = value);
        const temperature = new TemperatureCharacteristic(() => this.probeNumber, this.thermometerService);

        const service = new bleno.PrimaryService({
            uuid: CALCULATOR_SERVICE_UUID,
            characteristics: [
                probeSelect,
                temperature,
            ],
        });

        const services = [
            service,
        ];

        return new Promise<void>((resolve, reject) => {
            bleno.setServices(services, (error) => {
                if (error) {
                    return reject(error);
                } else {
                    return resolve();
                }
            });
        });

    }
}
