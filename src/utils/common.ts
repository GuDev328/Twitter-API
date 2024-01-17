import { ObjectId } from 'mongodb';

export const numberEnumtoArray = (enumObject: { [key: string]: string | number }) => {
  return Object.values(enumObject).filter((value) => typeof value === 'number') as number[];
};

export const stringArrayToObjectIdArray = (stringArray: string[]) => {
  return stringArray.map((id) => {
    return new ObjectId(id);
  });
};
