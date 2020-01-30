import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from 'redux';
import { CoreEvents, StoreState } from '../../../types';
import { cleanUpDashboard, dashboardInitCompleted } from '../../dashboard/state/actions';
import { DashboardModel } from '../../dashboard/state';
import { Emitter } from 'app/core/utils/emitter';
import { addVariable, changeVariableNameSucceeded, toVariablePayload } from '../state/actions';
import { appEvents } from 'app/core/core';
import { VariableTypeInAngularUpdated } from '../../../types/events';
import { variableAdapters } from '../adapters';
import { dispatch } from '../../../store/store';

let dashboardEvents: Emitter = null;

const onVariableTypeInAngularUpdated = ({ name, label, index, newType }: VariableTypeInAngularUpdated) => {
  const initialState = variableAdapters.get(newType).reducer(undefined, { type: '', payload: null });
  const model = {
    ...initialState.variable,
    name,
    type: newType,
    label,
    index,
  };
  dispatch(addVariable(toVariablePayload(model, { global: false, index, model })));
};

export const variableMiddleware: Middleware<{}, StoreState> = (store: MiddlewareAPI<Dispatch, StoreState>) => (
  next: Dispatch
) => (action: AnyAction) => {
  if (dashboardInitCompleted.match(action)) {
    const result = next(action);
    dashboardEvents = (store.getState().dashboard?.model as DashboardModel).events;
    appEvents.on(CoreEvents.variableTypeInAngularUpdated, onVariableTypeInAngularUpdated);
    return result;
  }

  if (cleanUpDashboard.match(action)) {
    const result = next(action);
    dashboardEvents = null;
    appEvents.off(CoreEvents.variableTypeInAngularUpdated, onVariableTypeInAngularUpdated);
    return result;
  }

  if (changeVariableNameSucceeded.match(action)) {
    const result = next(action);
    dashboardEvents?.emit(CoreEvents.variableNameInStateUpdated, {
      type: action.payload.type,
      uuid: action.payload.uuid,
    });
    appEvents.emit(CoreEvents.variableNameInStateUpdated, { type: action.payload.type, uuid: action.payload.uuid });
    return result;
  }

  if (addVariable.match(action)) {
    const result = next(action);
    const uuid = action.payload.uuid;
    const index = action.payload.data.index;
    dashboardEvents?.emit(CoreEvents.variableMovedToState, { index, uuid });
    appEvents.emit(CoreEvents.variableMovedToState, { index, uuid });
    return result;
  }

  return next(action);
};
