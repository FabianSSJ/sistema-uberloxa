export interface JwtPayload {
  /** ID del usuario en la DB */
  sub: number;
  username: string;
  nombre: string;
}
