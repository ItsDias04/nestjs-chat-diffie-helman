import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface CipherResult {
  matrix: string[][];
  result: string;
  explanation: string;
}

@Component({
  selector: 'app-column-cipher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './column-cipher.component.html',
  styleUrls: ['./column-cipher.component.css']
})
export class ColumnCipherComponent implements OnInit {
  inputText = '';
  matrixSize: 'auto' | 'custom' = 'auto';
  customRows = 5;
  customCols = 5;
  columnOrder = '';
  result: CipherResult | null = null;
  analysisResults: any[] = [];

  // Compatibility tables for Russian letters (from Python code)
  private left_compat: { [key: string]: string[] } = {
    'А': ['Л', 'Д', 'К', 'Т', 'В', 'Р', 'Н'],
    'Б': ['Я', 'Е', 'У', 'И', 'А', 'О'],
    'В': ['Я', 'Т', 'А', 'Е', 'И', 'О'],
    'Г': ['Р', 'У', 'А', 'И', 'Е', 'О'],
    'Д': ['Р', 'Я', 'У', 'А', 'И', 'Е', 'О'],
    'Е': ['М', 'И', 'Л', 'Д', 'Т', 'Р', 'Н'],
    'Ж': ['Р', 'Е', 'И', 'А', 'У', 'О'],
    'З': ['О', 'Е', 'А', 'И'],
    'И': ['Р', 'Т', 'М', 'И', 'О', 'Л', 'Н'],
    'К': ['Ь', 'В', 'Е', 'О', 'А', 'И', 'С'],
    'Л': ['Г', 'В', 'Ы', 'И', 'Е', 'О', 'А'],
    'М': ['Я', 'Ы', 'А', 'И', 'Е', 'О'],
    'Н': ['Д', 'Ь', 'Н', 'О', 'А', 'И', 'Е'],
    'О': ['Р', 'П', 'К', 'В', 'Т', 'Н'],
    'П': ['В', 'С', 'У', 'А', 'И', 'Е', 'О'],
    'Р': ['И', 'К', 'Т', 'А', 'П', 'О', 'Е'],
    'С': ['С', 'Т', 'В', 'А', 'Е', 'И', 'О'],
    'Т': ['Ч', 'У', 'И', 'А', 'Е', 'О', 'С'],
    'У': ['П', 'Т', 'К', 'Д', 'Н', 'М', 'Р'],
    'Ф': ['Н', 'А', 'Е', 'О', 'И'],
    'Х': ['У', 'Е', 'О', 'А', 'Ы', 'И'],
    'Ц': ['Е', 'Ю', 'Н', 'А', 'И'],
    'Ч': ['Е', 'А', 'У', 'И', 'О'],
    'Ш': ['Ь', 'У', 'Ы', 'Е', 'О', 'А', 'И', 'В'],
    'Щ': ['Е', 'Б', 'А', 'Ю', 'Я'],
    'Ы': ['М', 'Р', 'Т', 'С', 'Б', 'В', 'Н'],
    'Ь': ['Н', 'С', 'Т', 'Л'],
    'Э': ['С', 'Ы', 'М', 'Л', 'Д', 'Т', 'Р', 'Н'],
    'Ю': ['Ь', 'О', 'А', 'И', 'Л', 'У'],
    'Я': ['О', 'Н', 'Р', 'Л', 'А', 'И', 'С']
  };

  private right_compat: { [key: string]: string[] } = {
    'А': ['Л', 'Н', 'С', 'Т', 'Р', 'В', 'К', 'М'],
    'Б': ['О', 'Ы', 'Е', 'А', 'Р', 'У'],
    'В': ['О', 'А', 'И', 'Ы', 'С', 'Н', 'Л', 'Р'],
    'Г': ['О', 'А', 'Р', 'Л', 'И', 'В'],
    'Д': ['Е', 'А', 'И', 'О', 'Н', 'У', 'Р', 'В'],
    'Е': ['Н', 'Т', 'Р', 'С', 'Л', 'В', 'М', 'И'],
    'Ж': ['Е', 'И', 'Д', 'А', 'Н'],
    'З': ['А', 'Н', 'В', 'О', 'М', 'Д'],
    'И': ['С', 'Н', 'В', 'И', 'Е', 'М', 'К', 'З'],
    'К': ['О', 'А', 'И', 'Р', 'У', 'Т', 'Л', 'Е'],
    'Л': ['И', 'Е', 'О', 'А', 'Ь', 'Я', 'Ю', 'У'],
    'М': ['И', 'Е', 'О', 'У', 'А', 'Н', 'П', 'Ы'],
    'Н': ['О', 'А', 'И', 'Е', 'Ы', 'Н', 'У'],
    'О': ['В', 'С', 'Т', 'Р', 'И', 'Д', 'Н', 'М'],
    'П': ['О', 'Р', 'Е', 'А', 'У', 'И', 'Л'],
    'Р': ['А', 'Е', 'О', 'И', 'У', 'Я', 'Ы', 'Н'],
    'С': ['Т', 'К', 'О', 'Я', 'Е', 'Ь', 'С', 'Н'],
    'Т': ['О', 'А', 'Е', 'И', 'Ь', 'В', 'Р', 'С'],
    'У': ['Т', 'П', 'С', 'Д', 'Н', 'Ю', 'Ж'],
    'Ф': ['И', 'Е', 'О', 'А'],
    'Х': ['О', 'И', 'С', 'Н', 'В', 'П', 'Р'],
    'Ц': ['И', 'Е', 'А', 'Ы'],
    'Ч': ['Е', 'И', 'Т', 'Н'],
    'Ш': ['Е', 'И', 'Н', 'А', 'О', 'Л'],
    'Щ': ['Е', 'И', 'А'],
    'Ы': ['Л', 'Х', 'Е', 'М', 'И', 'В', 'С', 'Н'],
    'Ь': ['Н', 'К', 'В', 'П', 'С', 'Е', 'О', 'И'],
    'Э': ['Н', 'Т', 'Р', 'С', 'К'],
    'Ю': ['Д', 'Т', 'Щ', 'Ц', 'Н', 'П'],
    'Я': ['В', 'С', 'Т', 'П', 'Д', 'К', 'М', 'Л']
  };

  // Словарь русских слов (загружается из assets)
  private dictionary: Set<string> = new Set();
  private dictionaryLoaded = false;

  // Таблица совместимости для русского языка (упрощенная) - оставляем для совместимости, но основная оценка теперь как в Python
  private russianBigrams = new Set([
    // Расширённый набор вероятных биграмм для русского языка (в верхнем регистре)
    'АА','АБ','АВ','АГ','АД','АЕ','АЖ','АЗ','АК','АЛ','АМ','АН','АО','АП','АР','АС','АТ','АУ','АФ','АХ','АЦ','АЧ','АШ','АЩ','АЕ','АЮ','АЯ',
    'БА','БЕ','БИ','БО','БУ','БЫ','БЬ','БЯ','БР','БЛ','БН','БД','БЗ','БК','БС',
    'ВА','ВЕ','ВИ','ВО','ВУ','ВЫ','ВЬ','ВЯ','ВК','ВН','ВР','ВС','ВТ','ВЛ','ВП','ВГ',
    'ГА','ГЕ','ГИ','ГО','ГУ','ГЫ','ГЛ','ГР','ГД','ГН','ГЖ','ГЗ',
    'ДА','ДЕ','ДИ','ДО','ДУ','ДЫ','ДЬ','ДЯ','ДР','ДЛ','ДН','ДЗ','ДК','ДТ','ДД',
    'ЕА','ЕБ','ЕВ','ЕГ','ЕД','ЕЕ','ЕЖ','ЕЗ','ЕК','ЕЛ','ЕМ','ЕН','ЕП','ЕР','ЕС','ЕТ','ЕХ','ЕЦ','ЕЧ','ЕЮ','ЕЯ',
    'ЖА','ЖЕ','ЖИ','ЖО','ЖУ','ЖД','ЖН','ЖР','ЖК',
    'ЗА','ЗЕ','ЗИ','ЗО','ЗУ','ЗЫ','ЗЬ','ЗЯ','ЗВ','ЗД','ЗН','ЗР','ЗК','ЗС',
    'ИА','ИБ','ИВ','ИГ','ИД','ИЕ','ИЖ','ИЗ','ИК','ИЛ','ИМ','ИН','ИП','ИР','ИС','ИТ','ИЧ','ИЮ','ИЯ',
    'КА','КЕ','КИ','КО','КУ','КЫ','КЬ','КЯ','КЛ','КР','КН','КД','КЗ','КС','КТ','КП',
    'ЛА','ЛЕ','ЛИ','ЛО','ЛУ','ЛЫ','ЛЬ','ЛЯ','ЛК','ЛН','ЛМ','ЛР','ЛС','ЛТ','ЛВ','ЛД',
    'МА','МЕ','МИ','МО','МУ','МЫ','МЬ','МЯ','МН','МР','МС','МТ','МЛ','МД','МК',
    'НА','НЕ','НИ','НО','НУ','НЫ','НЬ','НЯ','НГ','НД','НЗ','НК','НС','НТ','НР','НЛ',
    'ОА','ОБ','ОВ','ОГ','ОД','ОЕ','ОЖ','ОЗ','ОК','ОЛ','ОМ','ОН','ОП','ОР','ОС','ОТ','ОЧ','ОЮ','ОЯ',
    'ПА','ПЕ','ПИ','ПО','ПУ','ПЫ','ПЬ','ПЯ','ПР','ПЛ','ПС','ПТ','ПН','ПД','ПК',
    'РА','РЕ','РИ','РО','РУ','РЫ','РЬ','РЯ','РВ','РГ','РД','РЗ','РК','РН','РС','РТ','РЛ',
    'СА','СЕ','СИ','СО','СУ','СЫ','СЬ','СЯ','СВ','СК','СЛ','СМ','СН','СП','СР','СС','СТ','СЧ','СХ',
    'ТА','ТЕ','ТИ','ТО','ТУ','ТЫ','ТЬ','ТЯ','ТР','ТЛ','ТН','ТС','ТК','ТВ','ТД',
    'УА','УБ','УВ','УГ','УД','УЕ','УЗ','УК','УЛ','УМ','УН','УП','УР','УС','УТ','УЧ','УШ','УЯ',
    'ФА','ФЕ','ФИ','ФО','ФУ','ФР','ФЛ','ФЬ',
    'ХА','ХЕ','ХИ','ХО','ХУ','ХР','ХЛ','ХН',
    'ЦА','ЦЕ','ЦИ','ЦО','ЦУ','ЦК','ЦН',
    'ЧА','ЧЕ','ЧИ','ЧО','ЧУ','ЧК','ЧН','ЧР','ЧС','ЧТ',
    'ША','ШЕ','ШИ','ШО','ШУ','ШК','ШЛ','ШН','ШТ','ШР',
    'ЩА','ЩЕ','ЩИ','ЩО','ЩУ','ЩК',
    'ЭА','ЭВ','ЭК','ЭЛ','ЭМ','ЭН','ЭР','ЭС','ЭТ',
    'ЮА','ЮБ','ЮД','ЮР','ЮС','ЮТ','ЮК',
    'ЯА','ЯВ','ЯД','ЯЗ','ЯК','ЯЛ','ЯМ','ЯН','ЯР','ЯС','ЯТ','ЯЧ'
  ]);

  ngOnInit(): void {
    this.loadDictionary();
  }

  updateMatrixSize() {
    // Метод для обновления размера матрицы (можно расширить при необходимости)
  }

  encrypt() {
    const text = this.inputText.toUpperCase().replace(/\s+/g, '_');
    const { rows, cols } = this.getMatrixDimensions(text.length);

    // Дополняем текст до нужной длины
    const paddedText = text.padEnd(rows * cols, '_');

    // Создаем матрицу и заполняем по строкам
    const matrix: string[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: string[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(paddedText[i * cols + j]);
      }
      matrix.push(row);
    }

    // Читаем по столбцам
    let encrypted = '';
    for (let j = 0; j < cols; j++) {
      for (let i = 0; i < rows; i++) {
        encrypted += matrix[i][j];
      }
    }

    this.result = {
      matrix: matrix,
      result: encrypted,
      explanation: `Текст записан в матрицу ${rows}×${cols} по строкам и прочитан по столбцам.`
    };

    this.analysisResults = [];
  }

  async decrypt() {
    const text = this.inputText.toUpperCase();
    const { rows, cols } = this.getMatrixDimensions(text.length);

    if (this.columnOrder.trim()) {
      // Расшифрование с заданным порядком столбцов
      this.decryptWithOrder(text, rows, cols, this.parseColumnOrder());
    } else {
      // Автоматический криптоанализ
      await this.performCryptanalysis(text, rows, cols);
    }
  }

  async analyzeText() {
    const text = this.inputText.toUpperCase();
    const { rows, cols } = this.getMatrixDimensions(text.length);
    await this.performCryptanalysis(text, rows, cols);
  }

  private decryptWithOrder(text: string, rows: number, cols: number, order: number[]) {
    // Создаем матрицу и заполняем по столбцам в исходном порядке
    const matrix: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));

    let index = 0;
    for (let j = 0; j < cols; j++) {
      for (let i = 0; i < rows; i++) {
        if (index < text.length) {
          matrix[i][j] = text[index++];
        }
      }
    }

    // Переставляем столбцы согласно заданному порядку
    const reorderedMatrix: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        reorderedMatrix[i][order[j] - 1] = matrix[i][j];
      }
    }

    // Читаем по строкам
    let decrypted = '';
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        decrypted += reorderedMatrix[i][j];
      }
    }

    this.result = {
      matrix: reorderedMatrix,
      result: decrypted.replace(/_/g, ' '),
      explanation: `Текст расшифрован с порядком столбцов: ${order.join(', ')}`
    };
  }

  private async performCryptanalysis(text: string, rows: number, cols: number) {
    // Убедимся, что словарь загружен
    if (!this.dictionaryLoaded) {
      await this.loadDictionary();
    }

    const baseArr = Array.from({ length: cols }, (_, i) => i + 1);
    const permutations = this.generatePermutations(baseArr);
    const variants: any[] = [];

    // Ограничиваем количество пытаемых перестановок для скорости
    const limit = Math.min(permutations.length, 10000); // можно настроить
    // const limit = 10000;
    for (let k = 0; k < limit; k++) {
      const perm = permutations[k];
      const decrypted = this.decryptWithPermutation(text, rows, cols, perm);
      const score = this.getScore(decrypted); // Используем scoring из Python

      variants.push({
        order: perm,
        text: decrypted.replace(/_/g, ' '),
        score
      });
    }

    // Сортируем по убыванию оценки (как в Python, где max_score)
    variants.sort((a, b) => b.score - a.score);

    this.analysisResults = variants.slice(0, 10);

    if (variants.length > 0) {
      const best = variants[0];
      this.result = {
        matrix: this.createMatrix(text, rows, cols, best.order),
        result: best.text,
        explanation: `Автоматический криптоанализ (как в Python). Проверено ${limit} перестановок. Лучший результат с порядком столбцов: ${best.order.join(', ')}`
      };
    }
  }

  private decryptWithPermutation(text: string, rows: number, cols: number, order: number[]): string {
    // Создаем матрицу и заполняем по столбцам
    const matrix: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));

    let index = 0;
    for (let j = 0; j < cols; j++) {
      for (let i = 0; i < rows; i++) {
        if (index < text.length) {
          matrix[i][j] = text[index++];
        }
      }
    }

    // Переставляем столбцы и читаем по строкам
    let result = '';
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result += matrix[i][order[j] - 1];
      }
    }

    return result;
  }

  private createMatrix(text: string, rows: number, cols: number, order: number[]): string[][] {
    const matrix: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));

    let index = 0;
    for (let j = 0; j < cols; j++) {
      for (let i = 0; i < rows; i++) {
        if (index < text.length) {
          matrix[i][j] = text[index++];
        }
      }
    }

    // Переставляем столбцы
    const reorderedMatrix: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        reorderedMatrix[i][order[j] - 1] = matrix[i][j];
      }
    }

    return reorderedMatrix;
  }

  // Функция оценки из Python кода
  private getScore(text: string): number {
    let score = 0;
    for (let i = 0; i < text.length - 1; i++) {
      const c1 = text[i];
      const c2 = text[i + 1];
      if (c1 === '_' || c2 === '_') {
        continue;
      }
      if (c2 in this.left_compat && this.left_compat[c2].includes(c1)) {
        score += this.left_compat[c2].length - this.left_compat[c2].indexOf(c1);
      }
      if (c1 in this.right_compat && this.right_compat[c1].includes(c2)) {
        score += this.right_compat[c1].length - this.right_compat[c1].indexOf(c2);
      }
    }
    return score;
  }

  // Оставляем оригинальную evaluateText на случай, если нужно комбинировать, но сейчас используем getScore
  private evaluateText(text: string): number {
    let score = 0;

    // Оценка на основе биграмм
    for (let i = 0; i < text.length - 1; i++) {
      const bigram = text[i] + text[i + 1];
      if (this.russianBigrams.has(bigram)) {
        score += 1.5; // чуть меньший вес, так как мы добавим оценку слов
      }
    }

    // Оценка на основе найденных слов в словаре
    // Разделяем на слова по пробелам/подчеркиваниям и очищаем от знаков препинания
    const rawWords = text.replace(/_/g, ' ').split(/\s+/).filter(w => w.length > 0);
    let foundWords = 0;
    let totalWords = 0;

    for (const raw of rawWords) {
      // Оставляем только русские буквы и Ё
      const w = raw.toUpperCase().replace(/[^А-ЯЁ]/g, '');
      if (!w) continue;
      totalWords++;
      if (this.dictionary.has(w)) {
        foundWords++;
      }
    }

    if (totalWords > 0) {
      // Вес слов: каждая найденная «хорошая» лексема даёт большой бонус
      score += foundWords * 8;

      // Также небольшой бонус за долю найденных слов
      score += (foundWords / totalWords) * 10;
    }

    // Дополнительные эвристики: соотношение гласных/согласных
    const vowels = 'АЕЁИОУЫЭЮЯ';
    const consonants = 'БВГДЖЗЙКЛМНПРСТФХЦЧШЩ';

    let vowelCount = 0;
    let consonantCount = 0;

    for (const char of text) {
      if (vowels.includes(char)) vowelCount++;
      else if (consonants.includes(char)) consonantCount++;
    }

    const ratio = consonantCount > 0 ? vowelCount / consonantCount : 0;
    if (ratio >= 0.35 && ratio <= 0.7) {
      score += 3;
    }

    // Штраф за подряд идущие одинаковые классы
    for (let i = 0; i < text.length - 2; i++) {
      const c1 = text[i];
      const c2 = text[i + 1];
      const c3 = text[i + 2];
      if ((consonants.includes(c1) && consonants.includes(c2) && consonants.includes(c3)) ||
          (vowels.includes(c1) && vowels.includes(c2) && vowels.includes(c3))) {
        score -= 0.8;
      }
    }

    // Небольшой штраф за недопустимые символы
    const nonLetters = text.replace(/[А-ЯЁ_\s]/g, '');
    if (nonLetters.length > 0) score -= nonLetters.length * 0.2;

    return score;
  }

  private generatePermutations(arr: number[]): number[][] {
    if (arr.length <= 1) return [arr];

    const result: number[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const perms = this.generatePermutations(rest);
      for (const perm of perms) {
        result.push([arr[i], ...perm]);
      }
    }

    return result;
  }

  private getMatrixDimensions(textLength: number): { rows: number, cols: number } {
    if (this.matrixSize === 'custom') {
      return { rows: this.customRows, cols: this.customCols };
    }

    // Автоматический режим - ищем размеры квадратной или близкой к квадратной матрицы
    const sqrt = Math.sqrt(textLength);
    let rows = Math.ceil(sqrt);
    let cols = Math.ceil(textLength / rows);

    return { rows, cols };
  }

  private parseColumnOrder(): number[] {
    return this.columnOrder.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }

  getColumnHeaders(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  applyVariant(variant: any) {
    this.columnOrder = variant.order.join(',');
    this.result = {
      matrix: this.createMatrix(this.inputText.toUpperCase(),
                               this.getMatrixDimensions(this.inputText.length).rows,
                               this.getMatrixDimensions(this.inputText.length).cols,
                               variant.order),
      result: variant.text,
      explanation: `Применен вариант с порядком столбцов: ${variant.order.join(', ')}`
    };
  }

  loadExample(exampleNumber: number) {
    switch (exampleNumber) {
      case 1:
        this.inputText = 'СВПООЗЛУЙЬСТЬ_ЕДПСОКОКАЙЗО';
        this.matrixSize = 'custom';
        this.customRows = 5;
        this.customCols = 5;
        this.columnOrder = '2,5,1,3,4';
        break;
      case 2:
        this.inputText = 'НЗМАЕЕАА_Г_НОТВОССОТЬЯАЛС';
        this.matrixSize = 'auto';
        this.columnOrder = '';
        break;
      case 3:
        this.inputText = 'РППОЕААДТВЛ_ЕБЬЛНЫЕ_ПА_ВР';
        this.matrixSize = 'auto';
        this.columnOrder = '';
        break;
    }
    this.result = null;
    this.analysisResults = [];
  }

  clear() {
    this.inputText = '';
    this.columnOrder = '';
    this.result = null;
    this.analysisResults = [];
    this.matrixSize = 'auto';
    this.customRows = 5;
    this.customCols = 5;
  }

  // Загружаем словарь из assets/russian_words.txt (по одному слову на строку)
  private async loadDictionary(): Promise<void> {
    try {
      const resp = await fetch('/assets/russian_words.txt');
      if (!resp.ok) throw new Error('Не удалось загрузить словарь');
      const txt = await resp.text();
      const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      for (const line of lines) {
        const w = line.toUpperCase().replace(/[^А-ЯЁ]/g, '');
        if (w) this.dictionary.add(w);
      }

      this.dictionaryLoaded = true;
      console.log(`Загружено слов: ${this.dictionary.size}`);
    } catch (e) {
      // Если не удалось загрузить внешний словарь — используем небольшой встроенный набор
      const fallback = ['И','В','НЕ','НА','С','Я','ОН','ОНА','ОНИ','ТО','ЭТО','БЫТЬ','КТО','ЧТО','ГДЕ','КАК','ПО','АЛЛО'];
      for (const w of fallback) this.dictionary.add(w);
      this.dictionaryLoaded = true;
      console.warn('Не удалось загрузить словарь из assets — используется запасной набор. ', e);
    }
  }
}