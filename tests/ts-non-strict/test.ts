import { Optic } from '../../src/Optic';
import { optic } from '../../src/constructors';
import { total } from '../../src/types';

const onD: Optic<string, total> = optic<{ a: { b: { c: { d: string } } } }>().focus('a.b.c.d');
