//ARCHIVO: calculo-imc.shcema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type CalculoImcDocument = CalculoImc & Document;

@Schema({ collection: 'calculos', timestamps: true })
export class CalculoImc {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId | User;

  @Prop({ required: true })
  altura: number;

  @Prop({ required: true })
  peso: number;

  @Prop({ required: true })
  imc: number;

  @Prop({ required: true })
  categoria: string;

  @Prop({ default: Date.now })
  fecha_calculo: Date;

  // Solo para tipado en TypeScript
  id: string;
}

export const CalculoImcSchema = SchemaFactory.createForClass(CalculoImc);

// Virtual "id"
CalculoImcSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// toJSON config
CalculoImcSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id?.toString(); //Puede que no esté
    delete (ret as any)._id;
  },
});