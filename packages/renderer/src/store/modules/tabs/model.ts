export class ITab {
  public id = -1
  public url = ''
  // public isPinned = false

  public constructor({ active, url }, id: number) {
    this.url = url
    this.id = id
    if (active) {
      //
    }
    // this.isPinned = pinned
  }
}
