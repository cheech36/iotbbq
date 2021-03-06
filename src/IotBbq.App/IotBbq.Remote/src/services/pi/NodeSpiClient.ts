import * as pispi from "pi-spi";
import { ISpiClient } from "../contracts/ISpiClient";
/*
  Mode0 CPOL = 0, CPHA = 0.
  Mode1 CPOL = 0, CPHA = 1.
  Mode2 CPOL = 1, CPHA = 0.
  Mode3 CPOL = 1, CPHA = 1.
*/

export class NodeSpiClient implements ISpiClient {

    private spi: pispi.SPI;

    public async initialize(chipSelectLine: number): Promise<void> {

        this.spi = pispi.initialize("/dev/spidev0.0");
        this.spi.clockSpeed(1000000);
        this.spi.dataMode(0); // no flags
        this.spi.bitOrder(pispi.order.MSB_FIRST);
    }

    public transfer(buffer: Uint8Array): Promise<Uint8Array> {
        return new Promise<Uint8Array>((resolve, reject) => {
            const nodeBuffer = Buffer.from(Array.from(buffer));
            this.spi.transfer(nodeBuffer, nodeBuffer.length, (error, data: Buffer) => {
                if (error) {
                    return reject(error);
                } else {
                    return resolve(data);
                }
            });
        });
    }

    public close(): void {
        this.spi.close();
    }
}
