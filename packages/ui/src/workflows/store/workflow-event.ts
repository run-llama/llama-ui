import { JSONValue, RawEvent } from "../types";

export enum WorkflowEventType {
  StartEvent = "StartEvent",
  StopEvent = "StopEvent",
  InputRequiredEvent = "InputRequiredEvent",
  HumanResponseEvent = "HumanResponseEvent",
  ChatDeltaEvent = "ChatDeltaEvent",
  InternalDispatchEvent = "InternalDispatchEvent",
  StepStateChanged = "StepStateChanged",
  EventsQueueChanged = "EventsQueueChanged",
}

export const builtInEventTypes: string[] = [
  WorkflowEventType.StartEvent,
  WorkflowEventType.StopEvent,
  WorkflowEventType.InputRequiredEvent,
  WorkflowEventType.HumanResponseEvent,
  WorkflowEventType.ChatDeltaEvent,
  WorkflowEventType.InternalDispatchEvent,
  WorkflowEventType.StepStateChanged,
  WorkflowEventType.EventsQueueChanged,
];

export class WorkflowEvent {
  type: string;
  types?: string[] | undefined;
  data?: JSONValue | undefined;
  timestamp: Date;

  constructor(type: string, data: JSONValue, types?: string[]) {
    this.type = type;
    this.data = data;
    this.timestamp = new Date();
    this.types = types;
  }
  
  static fromRawEvent(event: RawEvent): WorkflowEvent {
    if (isStartEvent(event)) {
      return new StartEvent(event.type, event.value as { input: JSONValue }, event.types);
    }
    if (isStopEvent(event)) {
      return new StopEvent(event.type, event.value as { result: JSONValue }, event.types);
    }
    if (isInputRequiredEvent(event)) {
      return new InputRequiredEvent(event.type, event.value as { prefix: string }, event.types);
    }
    if (isHumanResponseEvent(event)) {
      return new HumanResponseEvent(event.type, event.value as { response: JSONValue }, event.types);
    }
    if (isChatDeltaEvent(event)) {
      return new ChatDeltaEvent(event.type, event.value as { delta: string }, event.types);
    }
    if (isInternalDispatchEvent(event)) {
      return new InternalDispatchEvent(event.type, event.value, event.types);
    }
    if (isEventsQueueChanged(event)) {
      return new EventsQueueChanged(event.type, event.value, event.types);
    }
    if (isStepStateChanged(event)) {
      return new StepStateChanged(event.type, event.value, event.types);
    }
    return new WorkflowEvent(event.type, event.value, event.types);
  }

  toRawEvent(): RawEvent {
    return {
      __is_pydantic: true,
      value: this.data ?? {},
      qualified_name: this.type,
      types: this.types || [],
      type: this.type,
    };
  }
}

export class StartEvent extends WorkflowEvent {
  declare data: { input: JSONValue };
  
  constructor(type: string, data: { input: JSONValue }, types?: string[]) {
    super(type, data, types);
  }
}

export class StopEvent extends WorkflowEvent {
  declare data: { result: JSONValue };
  
  constructor(type: string, data: { result: JSONValue }, types?: string[]) {
    super(type, data, types);
  }
}

export class InputRequiredEvent extends WorkflowEvent {
  declare data: { prefix: string };
  
  constructor(type: string, data: { prefix: string }, types?: string[]) {
    super(type, data, types);
  }
}

export class HumanResponseEvent extends WorkflowEvent {
  declare data: { response: JSONValue };
  
  constructor(type: string, data: { response: JSONValue }, types?: string[]) {
    super(type, data, types);
  }
}

export class ChatDeltaEvent extends WorkflowEvent {
  declare data: { delta: string };
  
  constructor(type: string, data: { delta: string }, types?: string[]) {
    super(type, data, types);
  }
}

export class InternalDispatchEvent extends WorkflowEvent {
  constructor(type: string, data: JSONValue, types?: string[]) {
    super(type, data, types);
  }
}

export class EventsQueueChanged extends WorkflowEvent {
  constructor(type: string, data: JSONValue, types?: string[]) {
    super(type, data, types);
  }
}

export class StepStateChanged extends WorkflowEvent {
  constructor(type: string, data: JSONValue, types?: string[]) {
    super(type, data, types);
  }
}

/**
 * All isXXXEvent functions are used to determine if an event is of a specific type
 * They will take both RawEvent and WorkflowEvent as input for convenience
 * When used with WorkflowEvent, they act as type guards for TypeScript narrowing
 */
export function isStartEvent(event: WorkflowEvent): event is StartEvent;
export function isStartEvent(event: RawEvent): boolean;
export function isStartEvent(event: RawEvent | WorkflowEvent): boolean {
  if (event instanceof WorkflowEvent) {
    return event instanceof StartEvent;
  }
  if (event.type === WorkflowEventType.StartEvent) {
    return true;
  }
  return event.types?.includes(WorkflowEventType.StartEvent) ?? false;
}

export function isStopEvent(event: WorkflowEvent): event is StopEvent;
export function isStopEvent(event: RawEvent): boolean;
export function isStopEvent(event: RawEvent | WorkflowEvent): boolean {
  if (event instanceof WorkflowEvent) {
    return event instanceof StopEvent;
  }
  if (event.type === WorkflowEventType.StopEvent) {
    return true;
  }
  return event.types?.includes(WorkflowEventType.StopEvent) ?? false;
}

export function isInputRequiredEvent(event: WorkflowEvent): event is InputRequiredEvent;
export function isInputRequiredEvent(event: RawEvent): boolean;
export function isInputRequiredEvent(event: RawEvent | WorkflowEvent): boolean {
  if (event instanceof WorkflowEvent) {
    return event instanceof InputRequiredEvent;
  }
  if (event.type === WorkflowEventType.InputRequiredEvent) {
    return true;
  }
  return event.types?.includes(WorkflowEventType.InputRequiredEvent) ?? false;
}

export function isHumanResponseEvent(event: WorkflowEvent): event is HumanResponseEvent;
export function isHumanResponseEvent(event: RawEvent): boolean;
export function isHumanResponseEvent(event: RawEvent | WorkflowEvent): boolean {
  if (event instanceof WorkflowEvent) {
    return event instanceof HumanResponseEvent;
  }
  if (event.type === WorkflowEventType.HumanResponseEvent) {
    return true;
  }
  return event.types?.includes(WorkflowEventType.HumanResponseEvent) ?? false;
}

export function isChatDeltaEvent(event: WorkflowEvent): event is ChatDeltaEvent;
export function isChatDeltaEvent(event: RawEvent): boolean;
export function isChatDeltaEvent(event: RawEvent | WorkflowEvent): boolean {
  if (event instanceof WorkflowEvent) {
    return event instanceof ChatDeltaEvent;
  }
  if (event.type === WorkflowEventType.ChatDeltaEvent) {
    return true;
  }
  return event.types?.includes(WorkflowEventType.ChatDeltaEvent) ?? false;
}

export function isInternalDispatchEvent(event: WorkflowEvent): event is InternalDispatchEvent;
export function isInternalDispatchEvent(event: RawEvent): boolean;
export function isInternalDispatchEvent(event: RawEvent | WorkflowEvent): boolean {
  if (event instanceof WorkflowEvent) {
    return event instanceof InternalDispatchEvent;
  }
  if (event.type === WorkflowEventType.InternalDispatchEvent) {
    return true;
  }
  return event.types?.includes(WorkflowEventType.InternalDispatchEvent) ?? false;
}

export function isStepStateChanged(event: WorkflowEvent): event is StepStateChanged;
export function isStepStateChanged(event: RawEvent): boolean;
export function isStepStateChanged(event: RawEvent | WorkflowEvent): boolean {
  if (event instanceof WorkflowEvent) {
    return event instanceof StepStateChanged;
  }
  if (event.type === WorkflowEventType.StepStateChanged) {
    return true;
  }
  return event.types?.includes(WorkflowEventType.StepStateChanged) ?? false;
}

export function isEventsQueueChanged(event: WorkflowEvent): event is EventsQueueChanged;
export function isEventsQueueChanged(event: RawEvent): boolean;
export function isEventsQueueChanged(event: RawEvent | WorkflowEvent): boolean {
  if (event instanceof WorkflowEvent) {
    return event instanceof EventsQueueChanged;
  }
  if (event.type === WorkflowEventType.EventsQueueChanged) {
    return true;
  }
  return event.types?.includes(WorkflowEventType.EventsQueueChanged) ?? false;
}

/**
 * Check if an event is a built-in event
 */
export function isBuiltInEvent(event: WorkflowEvent): boolean {
  return builtInEventTypes.includes(event.type);
}

/**
 * Check if an event is an overridden built-in event
 * e.g MyStartEvent(StartEvent)
 */
export function isOverriddenBuiltInEvent(event: WorkflowEvent): boolean {
  if (builtInEventTypes.includes(event.type)) {
    return false;
  }
  for (const type of event.types ?? []) {
    if (builtInEventTypes.includes(type)) {
      return true;
    }
  }
  return false;
}


/**
 * Check if an event is a custom event
 * e.g CustomEvent(Event)
 */
export function isCustomEvent(event: WorkflowEvent): boolean {
  return !builtInEventTypes.includes(event.type) && !isOverriddenBuiltInEvent(event);
}