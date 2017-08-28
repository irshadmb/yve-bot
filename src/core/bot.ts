import { Rule } from '../types';
import { Store } from './store';
import { Controller } from './controller';
import { Actions } from './actions';
import { Types } from './types';
import { Validators } from './validators';

const DEFAULT_OPTS = {
  rule: {
    delay: 1000,
    actions: [],
    preActions: [],
  },
};

export class YveBot {
  private handlers: { [handler: string]: () => any };

  public defaults: { rule: Rule };
  public rules: Rule[];
  public controller: Controller;
  public store: Store;
  public context: Object;

  public types: Types;
  public actions: Actions;
  public validators: Validators;

  constructor(rules: Rule[], context?: Object) {
    this.context = context || {};
    this.defaults = DEFAULT_OPTS;
    this.rules = rules;
    this.handlers = {};

    this.store = new Store(output => {
      this.dispatch('outputChanged', output);
    });
    this.controller = new Controller(this);

    this.on('error', err => { throw err });
  }

  on(evt: string, fn: (...args: any[]) => any): this {
    this.handlers[evt] = fn;
    return this;
  }

  start(): this {
    this.dispatch('start');
    this.controller.run().catch(this.tryCatch.bind(this));
    return this;
  }

  end(): this {
    this.dispatch('end', this.store.output());
    return this;
  }

  talk(message: string, opts?: Object): this {
    const rule = Object.assign({}, this.defaults.rule, opts || {});
    this.controller.sendMessage(message, rule);
    return this;
  }

  hear(message: string): this {
    this.controller.receiveMessage(message).catch(this.tryCatch.bind(this));
    return this;
  }

  dispatch(name: string, ...args) {
    if (name in this.handlers) {
      this.handlers[name](...args, this.context);
    }
  }

  private tryCatch(err: Error) {
    try {
      this.dispatch('error', err);
    } catch (e) {
      console.error(e);
    }
    this.end();
  }
}

YveBot.prototype.types = new Types;
YveBot.prototype.actions = new Actions;
YveBot.prototype.validators = new Validators;
