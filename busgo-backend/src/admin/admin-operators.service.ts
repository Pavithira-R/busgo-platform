import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { asc, count, eq } from 'drizzle-orm';
import type { Database } from '../db/relations.js';
import { busRoutes, type Operator, operators } from '../db/schema.js';
import type { CreateOperatorDto, UpdateOperatorDto } from './admin.schemas.js';

const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  const e = err as { cause?: { code?: string }; code?: string };
  return (e?.cause?.code ?? e?.code) === PG_UNIQUE_VIOLATION;
}

@Injectable()
export class AdminOperatorsService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  /** All operators, including deactivated ones, with how many routes they run. */
  list() {
    return this.db
      .select({
        id: operators.id,
        name: operators.name,
        phone: operators.phone,
        isActive: operators.isActive,
        createdAt: operators.createdAt,
        routeCount: count(busRoutes.id),
      })
      .from(operators)
      .leftJoin(busRoutes, eq(busRoutes.operatorId, operators.id))
      .groupBy(operators.id)
      .orderBy(asc(operators.name));
  }

  async create(dto: CreateOperatorDto): Promise<Operator> {
    try {
      const [operator] = await this.db
        .insert(operators)
        .values(dto)
        .returning();
      return operator;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(`Operator "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  /** Setting isActive to false hides all the operator's routes from search. */
  async update(id: number, dto: UpdateOperatorDto): Promise<Operator> {
    try {
      const [operator] = await this.db
        .update(operators)
        .set(dto)
        .where(eq(operators.id, id))
        .returning();
      if (!operator) throw new NotFoundException('Operator not found');
      return operator;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(`Operator "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  async requireActive(id: number): Promise<Operator> {
    const [operator] = await this.db
      .select()
      .from(operators)
      .where(eq(operators.id, id));
    if (!operator) throw new NotFoundException('Operator not found');
    if (!operator.isActive) {
      throw new ConflictException('Operator is deactivated');
    }
    return operator;
  }
}
