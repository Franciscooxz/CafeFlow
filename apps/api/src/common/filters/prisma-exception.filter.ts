import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error de base de datos';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = `Ya existe un registro con ese valor: ${(exception.meta?.target as string[])?.join(', ')}`;
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Registro no encontrado';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Referencia inválida';
        break;
      default:
        message = `Error de base de datos: ${exception.code}`;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
