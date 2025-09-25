import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'usuarios', timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  // Esto no se guarda en Mongo, es solo para el tipado de TypeScript
  id: string; //id virtual

  // Le decimos a TS que existe un campo _id, que Mongoose añade en compilación. Esto se usa
  // para buscar objetos usuarios al crear cálculos imc.
  _id: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Agregamos un virtual después de crear el schema
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Hacemos que el "id" se incluya en toJSON/toObject
UserSchema.set('toJSON', {
  virtuals: true,
});
UserSchema.set('toObject', {
  virtuals: true,
});