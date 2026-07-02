export function moveRelativeTo(
  order: string[],
  dragId: string,
  overId: string,
  after: boolean
): string[] {
  if (dragId === overId) return order;
  const next = order.filter((x) => x !== dragId);
  const idx = next.indexOf(overId);
  if (idx === -1) return order;
  next.splice(after ? idx + 1 : idx, 0, dragId);
  return next;
}

export function moveCardInBoard<C extends { id: string }, L extends { id: string; cards: C[] }>(
  lists: L[],
  cardId: string,
  toListId: string,
  index: number
): L[] {
  const sourceList = lists.find((l) => l.cards.some((c) => c.id === cardId));
  const card = sourceList?.cards.find((c) => c.id === cardId);
  if (!sourceList || !card) return lists;

  return lists.map((list) => {
    const without = list.cards.filter((c) => c.id !== cardId);
    if (list.id === toListId) {
      const next = [...without];
      const i = Math.max(0, Math.min(index, next.length));
      next.splice(i, 0, card);
      return { ...list, cards: next };
    }
    return without.length === list.cards.length ? list : { ...list, cards: without };
  });
}
