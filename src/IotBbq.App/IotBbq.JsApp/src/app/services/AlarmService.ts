
import { Utility } from './Utility';
import { Observable, Subscription, timer } from 'rxjs';
import { Inject } from '@angular/core';
import { GPIO_FACTORY_TOKEN, IGpio, IGpioFactory, InOrOut, PinValue } from './contracts/IGpio';
import { EventEmitter } from 'events';

export enum AlarmPriority {
  Normal,
  High
}

export class AlarmService extends EventEmitter {

  private _isAlarming = false;

  private whenToStop: Date = null;

  private normalPriorityInterval = 300;

  private highPriorityInterval = 150;

  private currentPriority: AlarmPriority = AlarmPriority.Normal;

  private alarmTimer: Observable<number> = null;

  private alarmSubscription: Subscription;

  private gpioPin: IGpio;

  private pinNumber = 16;

  private currentTags: any[] = [];

  constructor(
    @Inject(GPIO_FACTORY_TOKEN) gpioFactory: IGpioFactory) {
    super();
    this.gpioPin = gpioFactory.open(this.pinNumber, InOrOut.Out);
  }

  public isAlarming(): boolean {
    return this._isAlarming;
  }

  public silence(): void {
    if (this.isAlarming()) {
      this.alarmSubscription.unsubscribe();
      this.alarmTimer = null;
      this._isAlarming = false;

      this.emit('alarmStateChanged', false);

      // Emit the alarm silenced event with tags
      const tags = this.currentTags;
      this.currentTags = [];
      this.emit('alarmSilenced', tags);
    }
  }

  public triggerAlarm(priority: AlarmPriority, tag: Object, duration: number = null) {
    if (this.currentTags.indexOf(tag) === -1) {
      this.currentTags.push(tag);
    }

    if (!this.isAlarming() || (priority === AlarmPriority.High && this.currentPriority === AlarmPriority.Normal)) {
      const now = new Date();
      if (duration) {
        this.whenToStop = new Date(now.getTime() + duration);
      } else {
        this.whenToStop = null;
      }

      // Trigger the timer immediately
      this.currentPriority = priority;
      this._isAlarming = true;
      this.alarmTimer = timer(0, priority === AlarmPriority.High ? this.highPriorityInterval : this.normalPriorityInterval);
      this.alarmSubscription = this.alarmTimer.subscribe(async () => await this.onAlarmTimerTick());

      this.emit('alarmStateChanged', true);
    }
  }

  protected async doOneBeep(durationInMs: number): Promise<void> {
    this.gpioPin.write(PinValue.High);
    await Utility.sleep(durationInMs);
    this.gpioPin.write(PinValue.Low);
  }

  private async onAlarmTimerTick() {
    const now = new Date();
    if (this.whenToStop && now >= this.whenToStop) {
      this.silence();
      return;
    }

    // I think this is divided by 2 so there is an even space
    // between the tones when it is repeated
    await this.doOneBeep(this.normalPriorityInterval / 2);
  }
}
