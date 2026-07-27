export class ApiResponse<T> {
  constructor(
    public statusCode: number,
    public data: T,
    public message: string = "Success"
  ) {}

  get success(): boolean {
    return this.statusCode < 400;
  }
}
