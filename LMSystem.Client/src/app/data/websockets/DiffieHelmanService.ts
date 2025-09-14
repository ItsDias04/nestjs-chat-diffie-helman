import { Injectable } from "@angular/core";
import { Message } from "../../data/Entities/Message";
@Injectable({ providedIn: 'root' })
export class DiffieHelmanService {
    g = 5; // Пример значения g
    p = 23; // Пример значения p
    constructor() {}
    // Реализация алгоритма Диффи-Хеллманаа
    // (заглушка, реальная реализация зависит от требований безопасности и используемых библиотек)
    generatePrivateKey(): number {
        return Math.floor(Math.random() * 1000); // Пример генерации случайного числа
    }

}