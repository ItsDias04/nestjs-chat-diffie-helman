import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Matrix {
  rows: number;
  cols: number;
  data: number[][];
}

interface EigenResult {
  eigenvalue: number;
  eigenvector: number[];
}

@Component({
  selector: 'app-linear-algebra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './linear-algebra.component.html',
  styleUrls: ['./linear-algebra.component.css']
})
export class LinearAlgebraComponent {
  // Task 1: Matrix Operations
  matrixA: Matrix = {
    rows: 2,
    cols: 2,
    data: [[1, 2], [3, 4]]
  };
  
  matrixB: Matrix = {
    rows: 2,
    cols: 2,
    data: [[5, 6], [7, 8]]
  };
  
  scalarValue: number = 3;
  matrixAddResult: number[][] = [];
  matrixSubResult: number[][] = [];
  matrixScalarResult: number[][] = [];
  
  // Task 2: Determinants
  det2x2Matrix: Matrix = {
    rows: 2,
    cols: 2,
    data: [[4, 7], [2, 6]]
  };
  
  det3x3Matrix: Matrix = {
    rows: 3,
    cols: 3,
    data: [[1, 2, 3], [0, 1, 4], [5, 6, 0]]
  };
  
  det2x2Result: number | null = null;
  det3x3Result: number | null = null;
  
  // Task 3: Inverses
  inverse2x2Matrix: Matrix = {
    rows: 2,
    cols: 2,
    data: [[1, 2], [3, 4]]
  };
  
  inverse3x3Matrix: Matrix = {
    rows: 3,
    cols: 3,
    data: [[1, 0, 2], [2, 1, 0], [0, 1, 1]]
  };
  
  inverse2x2Result: number[][] | null = null;
  inverse3x3Result: number[][] | null = null;
  inverse2x2Error: string = '';
  inverse3x3Error: string = '';
  
  // Task 4: Systems of Linear Equations
  systemMatrix: Matrix = {
    rows: 3,
    cols: 3,
    data: [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]]
  };
  
  systemVector: number[] = [8, -11, -3];
  systemSolution: number[] | null = null;
  systemError: string = '';
  
  // Task 5: Eigenvalues and Eigenvectors
  eigenMatrix: Matrix = {
    rows: 2,
    cols: 2,
    data: [[4, 1], [2, 3]]
  };
  
  eigenResults: EigenResult[] = [];
  eigenError: string = '';
  
  // Task 6: Cramer's Rule
  cramerMatrix: Matrix = {
    rows: 3,
    cols: 3,
    data: [[3, -1, 2], [2, 1, -1], [1, -3, 3]]
  };
  
  cramerVector: number[] = [7, 4, -1];
  cramerSolution: number[] | null = null;
  cramerError: string = '';
  
  // Task 7: Row Reduction
  augmentedMatrix: Matrix = {
    rows: 3,
    cols: 4,
    data: [[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]]
  };
  
  rrefResult: number[][] | null = null;
  rrefSolution: number[] | null = null;
  
  // Task 8: Determinant and Inverse Relationship
  testMatrix: Matrix = {
    rows: 2,
    cols: 2,
    data: [[2, 3], [4, 6]]
  };
  
  detInverseTest: {
    determinant: number | null;
    isInvertible: boolean;
    inverse: number[][] | null;
  } = {
    determinant: null,
    isInvertible: false,
    inverse: null
  };
  
  activeTab: string = 'operations';

  // Task 1: Matrix Operations
  addMatrices(): void {
    if (this.matrixA.rows !== this.matrixB.rows || this.matrixA.cols !== this.matrixB.cols) {
      alert('Matrices must have the same dimensions for addition');
      return;
    }
    
    this.matrixAddResult = [];
    for (let i = 0; i < this.matrixA.rows; i++) {
      this.matrixAddResult[i] = [];
      for (let j = 0; j < this.matrixA.cols; j++) {
        this.matrixAddResult[i][j] = this.matrixA.data[i][j] + this.matrixB.data[i][j];
      }
    }
  }
  
  subtractMatrices(): void {
    if (this.matrixA.rows !== this.matrixB.rows || this.matrixA.cols !== this.matrixB.cols) {
      alert('Matrices must have the same dimensions for subtraction');
      return;
    }
    
    this.matrixSubResult = [];
    for (let i = 0; i < this.matrixA.rows; i++) {
      this.matrixSubResult[i] = [];
      for (let j = 0; j < this.matrixA.cols; j++) {
        this.matrixSubResult[i][j] = this.matrixA.data[i][j] - this.matrixB.data[i][j];
      }
    }
  }
  
  scalarMultiply(): void {
    this.matrixScalarResult = [];
    for (let i = 0; i < this.matrixA.rows; i++) {
      this.matrixScalarResult[i] = [];
      for (let j = 0; j < this.matrixA.cols; j++) {
        this.matrixScalarResult[i][j] = this.scalarValue * this.matrixA.data[i][j];
      }
    }
  }
  
  performAllMatrixOperations(): void {
    this.addMatrices();
    this.subtractMatrices();
    this.scalarMultiply();
  }
  
  // Task 2: Determinants
  calculateDeterminant(matrix: number[][]): number {
    const n = matrix.length;
    
    if (n === 1) {
      return matrix[0][0];
    }
    
    if (n === 2) {
      return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }
    
    let det = 0;
    for (let j = 0; j < n; j++) {
      const minor = this.getMinor(matrix, 0, j);
      det += Math.pow(-1, j) * matrix[0][j] * this.calculateDeterminant(minor);
    }
    
    return det;
  }
  
  getMinor(matrix: number[][], row: number, col: number): number[][] {
    return matrix
      .filter((_, i) => i !== row)
      .map(r => r.filter((_, j) => j !== col));
  }
  
  calculateDeterminants(): void {
    this.det2x2Result = this.calculateDeterminant(this.det2x2Matrix.data);
    this.det3x3Result = this.calculateDeterminant(this.det3x3Matrix.data);
  }
  
  // Task 3: Inverses
  calculateInverse(matrix: number[][]): number[][] | null {
    const n = matrix.length;
    const det = this.calculateDeterminant(matrix);
    
    if (Math.abs(det) < 1e-10) {
      return null; // Matrix is not invertible
    }
    
    if (n === 2) {
      return [
        [matrix[1][1] / det, -matrix[0][1] / det],
        [-matrix[1][0] / det, matrix[0][0] / det]
      ];
    }
    
    // For larger matrices, use adjugate method
    const adjugate = this.getAdjugate(matrix);
    return adjugate.map(row => row.map(val => val / det));
  }
  
  getAdjugate(matrix: number[][]): number[][] {
    const n = matrix.length;
    const adjugate: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      adjugate[i] = [];
      for (let j = 0; j < n; j++) {
        const minor = this.getMinor(matrix, i, j);
        const cofactor = Math.pow(-1, i + j) * this.calculateDeterminant(minor);
        adjugate[j][i] = cofactor; // Transpose
      }
    }
    
    return adjugate;
  }
  
  calculateInverses(): void {
    this.inverse2x2Error = '';
    this.inverse3x3Error = '';
    
    const inv2x2 = this.calculateInverse(this.inverse2x2Matrix.data);
    if (inv2x2 === null) {
      this.inverse2x2Error = 'Matrix is not invertible (determinant = 0)';
      this.inverse2x2Result = null;
    } else {
      this.inverse2x2Result = inv2x2;
    }
    
    const inv3x3 = this.calculateInverse(this.inverse3x3Matrix.data);
    if (inv3x3 === null) {
      this.inverse3x3Error = 'Matrix is not invertible (determinant = 0)';
      this.inverse3x3Result = null;
    } else {
      this.inverse3x3Result = inv3x3;
    }
  }
  
  // Task 4: Solving Systems of Linear Equations
  solveSystemGaussian(A: number[][], b: number[]): number[] | null {
    const n = A.length;
    const augmented: number[][] = A.map((row, i) => [...row, b[i]]);
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Check for singular matrix
      if (Math.abs(augmented[i][i]) < 1e-10) {
        return null;
      }
      
      // Eliminate column
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
    
    // Back substitution
    const x: number[] = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      x[i] /= augmented[i][i];
    }
    
    return x;
  }
  
  solveSystem(): void {
    this.systemError = '';
    const solution = this.solveSystemGaussian(
      this.systemMatrix.data.map(row => [...row]),
      [...this.systemVector]
    );
    
    if (solution === null) {
      this.systemError = 'System has no unique solution';
      this.systemSolution = null;
    } else {
      this.systemSolution = solution;
    }
  }
  
  // Task 5: Eigenvalues and Eigenvectors (2x2 matrices)
  calculateEigenvalues2x2(): void {
    this.eigenError = '';
    this.eigenResults = [];
    
    const matrix = this.eigenMatrix.data;
    
    if (matrix.length !== 2 || matrix[0].length !== 2) {
      this.eigenError = 'Only 2x2 matrices are supported for eigenvalue calculation';
      return;
    }
    
    const a = matrix[0][0];
    const b = matrix[0][1];
    const c = matrix[1][0];
    const d = matrix[1][1];
    
    // Characteristic equation: λ² - (a+d)λ + (ad-bc) = 0
    const trace = a + d;
    const det = a * d - b * c;
    
    const discriminant = trace * trace - 4 * det;
    
    if (discriminant < 0) {
      this.eigenError = 'Complex eigenvalues (not supported in this implementation)';
      return;
    }
    
    const lambda1 = (trace + Math.sqrt(discriminant)) / 2;
    const lambda2 = (trace - Math.sqrt(discriminant)) / 2;
    
    // Calculate eigenvectors
    const eigenvector1 = this.calculateEigenvector2x2(matrix, lambda1);
    const eigenvector2 = this.calculateEigenvector2x2(matrix, lambda2);
    
    this.eigenResults = [
      { eigenvalue: lambda1, eigenvector: eigenvector1 },
      { eigenvalue: lambda2, eigenvector: eigenvector2 }
    ];
  }
  
  calculateEigenvector2x2(matrix: number[][], eigenvalue: number): number[] {
    const a = matrix[0][0] - eigenvalue;
    const b = matrix[0][1];
    const c = matrix[1][0];
    const d = matrix[1][1] - eigenvalue;
    
    // Solve (A - λI)v = 0
    let v1: number, v2: number;
    
    if (Math.abs(b) > 1e-10) {
      v2 = 1;
      v1 = -b / a;
    } else if (Math.abs(c) > 1e-10) {
      v1 = 1;
      v2 = -c / d;
    } else {
      v1 = 1;
      v2 = 0;
    }
    
    // Normalize
    const magnitude = Math.sqrt(v1 * v1 + v2 * v2);
    return [v1 / magnitude, v2 / magnitude];
  }
  
  // Task 6: Cramer's Rule
  solveCramersRule(): void {
    this.cramerError = '';
    const A = this.cramerMatrix.data;
    const b = this.cramerVector;
    const n = A.length;
    
    const detA = this.calculateDeterminant(A);
    
    if (Math.abs(detA) < 1e-10) {
      this.cramerError = 'Matrix is singular, Cramer\'s rule cannot be applied';
      this.cramerSolution = null;
      return;
    }
    
    const solution: number[] = [];
    
    for (let i = 0; i < n; i++) {
      const Ai = A.map((row, rowIdx) =>
        row.map((val, colIdx) => (colIdx === i ? b[rowIdx] : val))
      );
      const detAi = this.calculateDeterminant(Ai);
      solution[i] = detAi / detA;
    }
    
    this.cramerSolution = solution;
  }
  
  // Task 7: Row Reduction (RREF)
  rowReduce(): void {
    const matrix = this.augmentedMatrix.data.map(row => [...row]);
    const rows = matrix.length;
    const cols = matrix[0].length;
    
    let lead = 0;
    
    for (let r = 0; r < rows; r++) {
      if (lead >= cols - 1) break;
      
      let i = r;
      while (Math.abs(matrix[i][lead]) < 1e-10) {
        i++;
        if (i === rows) {
          i = r;
          lead++;
          if (lead === cols - 1) break;
        }
      }
      
      if (lead === cols - 1) break;
      
      [matrix[i], matrix[r]] = [matrix[r], matrix[i]];
      
      const pivot = matrix[r][lead];
      for (let j = 0; j < cols; j++) {
        matrix[r][j] /= pivot;
      }
      
      for (let i = 0; i < rows; i++) {
        if (i !== r) {
          const factor = matrix[i][lead];
          for (let j = 0; j < cols; j++) {
            matrix[i][j] -= factor * matrix[r][j];
          }
        }
      }
      
      lead++;
    }
    
    this.rrefResult = matrix;
    
    // Extract solution
    if (cols === rows + 1) {
      this.rrefSolution = matrix.map(row => row[cols - 1]);
    }
  }
  
  // Task 8: Determinant and Inverse Relationship
  testDeterminantInverseRelationship(): void {
    const det = this.calculateDeterminant(this.testMatrix.data);
    this.detInverseTest.determinant = det;
    
    const isInvertible = Math.abs(det) > 1e-10;
    this.detInverseTest.isInvertible = isInvertible;
    
    if (isInvertible) {
      this.detInverseTest.inverse = this.calculateInverse(this.testMatrix.data);
    } else {
      this.detInverseTest.inverse = null;
    }
  }
  
  // Helper methods for UI
  updateMatrixSize(matrix: Matrix, rows: number, cols: number): void {
    matrix.rows = rows;
    matrix.cols = cols;
    
    // Adjust data array
    while (matrix.data.length < rows) {
      matrix.data.push(new Array(cols).fill(0));
    }
    matrix.data = matrix.data.slice(0, rows);
    
    for (let i = 0; i < rows; i++) {
      while (matrix.data[i].length < cols) {
        matrix.data[i].push(0);
      }
      matrix.data[i] = matrix.data[i].slice(0, cols);
    }
  }
  
  formatNumber(num: number): string {
    return Math.abs(num) < 1e-10 ? '0' : num.toFixed(4);
  }
  
  setTab(tab: string): void {
    this.activeTab = tab;
  }
}
