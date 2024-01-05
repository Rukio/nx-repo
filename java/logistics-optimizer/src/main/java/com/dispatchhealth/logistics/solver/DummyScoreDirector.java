package com.*company-data-covered*.logistics.solver;

import org.optaplanner.core.api.score.director.ScoreDirector;

public class DummyScoreDirector<T> implements ScoreDirector<T> {
  @Override
  public T getWorkingSolution() {
    return null;
  }

  @Override
  public void beforeEntityAdded(Object entity) {}

  @Override
  public void afterEntityAdded(Object entity) {}

  @Override
  public void beforeVariableChanged(Object entity, String variableName) {}

  @Override
  public void afterVariableChanged(Object entity, String variableName) {}

  @Override
  public void beforeListVariableElementAssigned(
      Object entity, String variableName, Object element) {}

  @Override
  public void afterListVariableElementAssigned(
      Object entity, String variableName, Object element) {}

  @Override
  public void beforeListVariableElementUnassigned(
      Object entity, String variableName, Object element) {}

  @Override
  public void afterListVariableElementUnassigned(
      Object entity, String variableName, Object element) {}

  @Override
  public void beforeListVariableChanged(
      Object entity, String variableName, int fromIndex, int toIndex) {}

  @Override
  public void afterListVariableChanged(
      Object entity, String variableName, int fromIndex, int toIndex) {}

  @Override
  public void triggerVariableListeners() {}

  @Override
  public void beforeEntityRemoved(Object entity) {}

  @Override
  public void afterEntityRemoved(Object entity) {}

  @Override
  public void beforeProblemFactAdded(Object problemFact) {}

  @Override
  public void afterProblemFactAdded(Object problemFact) {}

  @Override
  public void beforeProblemPropertyChanged(Object problemFactOrEntity) {}

  @Override
  public void afterProblemPropertyChanged(Object problemFactOrEntity) {}

  @Override
  public void beforeProblemFactRemoved(Object problemFact) {}

  @Override
  public void afterProblemFactRemoved(Object problemFact) {}

  @Override
  public <E> E lookUpWorkingObject(E externalObject) {
    return null;
  }

  @Override
  public <E> E lookUpWorkingObjectOrReturnNull(E externalObject) {
    return null;
  }
}
