import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { CreateUserDto } from './create-user.dto.js'
import { UpdateUserDto } from './update-user.dto.js'

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})

function parse(metatype: new () => object, value: object) {
  return pipe.transform(value, { type: 'body', metatype })
}

describe('user dto validation', () => {
  it('allows a partial update and rejects null fields', async () => {
    await expect(parse(UpdateUserDto, { age: 21 })).resolves.toMatchObject({
      age: 21,
    })
    await expect(parse(UpdateUserDto, {})).resolves.toEqual({})

    await expect(parse(UpdateUserDto, { age: null })).rejects.toBeInstanceOf(
      BadRequestException,
    )
    await expect(
      parse(UpdateUserDto, { description: null }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(parse(UpdateUserDto, { login: null })).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })

  it('rejects age outside 18..120 on create and update', async () => {
    const user = {
      login: 'vlad',
      email: 'vlad@example.com',
      password: 'password1',
      description: 'Backend developer',
    }

    await expect(
      parse(CreateUserDto, { ...user, age: 20 }),
    ).resolves.toMatchObject({
      age: 20,
    })
    await expect(
      parse(CreateUserDto, { ...user, age: 121 }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      parse(CreateUserDto, { ...user, age: 3_000_000_000 }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(parse(UpdateUserDto, { age: 120 })).resolves.toMatchObject({
      age: 120,
    })
    await expect(parse(UpdateUserDto, { age: 121 })).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })
})
