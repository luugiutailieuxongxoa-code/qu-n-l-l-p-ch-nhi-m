import { Student } from '../types';

export type TeamDivisionAlgorithm = 
  | 'gender_balance' // Cân bằng giới tính Nam - Nữ đều giữa các tổ (chuẩn sư phạm)
  | 'round_robin'    // Chia lần lượt tuần tự (1 -> Tổ 1, 2 -> Tổ 2, ...)
  | 'consecutive'    // Chia theo khối liên tục (ví dụ 10 em đầu Tổ 1, 10 em tiếp Tổ 2)
  | 'random_shuffle'; // Xáo trộn ngẫu nhiên hoàn toàn

export interface TeamDivisionOptions {
  numberOfTeams: number; // Mặc định 4 tổ
  algorithm: TeamDivisionAlgorithm;
  preserveSpecificStudents?: boolean; // Giữ nguyên các em đã chọn hoặc có tổ đặc thù
}

export interface TeamStatistic {
  team: number;
  total: number;
  maleCount: number;
  femaleCount: number;
  students: Student[];
}

/**
 * Xáo trộn mảng ngẫu nhiên (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Thuật toán chia tổ tự động thông minh
 */
export function divideStudentsIntoTeams(
  students: Student[],
  options: TeamDivisionOptions
): Student[] {
  const { numberOfTeams = 4, algorithm = 'gender_balance' } = options;
  if (students.length === 0 || numberOfTeams < 2) return students;

  const resultStudents: Student[] = students.map((s) => ({ ...s }));

  if (algorithm === 'gender_balance') {
    // 1. Thuật toán cân bằng Nam - Nữ (Pedagogical Gender Balance)
    const males = resultStudents.filter((s) => s.gender === 'Nam');
    const females = resultStudents.filter((s) => s.gender === 'Nữ');

    // Phân bổ nam lần lượt theo kiểu Snake Draft (1, 2, ..., n, n, ..., 2, 1) để cân đối sĩ số
    let currentTeam = 1;
    let direction = 1;

    males.forEach((male) => {
      male.team = currentTeam;
      currentTeam += direction;
      if (currentTeam > numberOfTeams) {
        currentTeam = numberOfTeams;
        direction = -1;
      } else if (currentTeam < 1) {
        currentTeam = 1;
        direction = 1;
      }
    });

    // Phân bổ nữ bắt đầu từ tổ cuối để bù trừ sĩ số
    currentTeam = numberOfTeams;
    direction = -1;

    females.forEach((female) => {
      female.team = currentTeam;
      currentTeam += direction;
      if (currentTeam < 1) {
        currentTeam = 1;
        direction = 1;
      } else if (currentTeam > numberOfTeams) {
        currentTeam = numberOfTeams;
        direction = -1;
      }
    });

    return resultStudents;
  }

  if (algorithm === 'round_robin') {
    // 2. Chia tuần tự vòng tròn (Học sinh 1 -> Tổ 1, 2 -> Tổ 2, 3 -> Tổ 3, 4 -> Tổ 4...)
    resultStudents.forEach((student, index) => {
      student.team = (index % numberOfTeams) + 1;
    });
    return resultStudents;
  }

  if (algorithm === 'consecutive') {
    // 3. Chia theo khối liên tục (Block consecutive)
    const total = resultStudents.length;
    const baseSize = Math.floor(total / numberOfTeams);
    const remainder = total % numberOfTeams;

    let currentIndex = 0;
    for (let team = 1; team <= numberOfTeams; team++) {
      // Các tổ đầu nhận thêm 1 em nếu có số dư
      const teamSize = baseSize + (team <= remainder ? 1 : 0);
      for (let i = 0; i < teamSize && currentIndex < total; i++) {
        resultStudents[currentIndex].team = team;
        currentIndex++;
      }
    }
    return resultStudents;
  }

  if (algorithm === 'random_shuffle') {
    // 4. Xáo trộn ngẫu nhiên hoàn toàn
    const shuffled = shuffleArray(resultStudents);
    shuffled.forEach((student, index) => {
      student.team = (index % numberOfTeams) + 1;
    });
    // Trả về theo thứ tự ban đầu nhưng với team mới
    const teamMap = new Map<string, number>();
    shuffled.forEach((s) => teamMap.set(s.id, s.team));

    return resultStudents.map((s) => ({
      ...s,
      team: teamMap.get(s.id) || 1,
    }));
  }

  return resultStudents;
}

/**
 * Tính toán thống kê chi tiết từng tổ
 */
export function calculateTeamStatistics(
  students: Student[],
  numberOfTeams: number = 4
): TeamStatistic[] {
  const stats: TeamStatistic[] = [];

  for (let teamNum = 1; teamNum <= numberOfTeams; teamNum++) {
    const teamStudents = students.filter((s) => s.team === teamNum);
    const maleCount = teamStudents.filter((s) => s.gender === 'Nam').length;
    const femaleCount = teamStudents.filter((s) => s.gender === 'Nữ').length;

    stats.push({
      team: teamNum,
      total: teamStudents.length,
      maleCount,
      femaleCount,
      students: teamStudents,
    });
  }

  return stats;
}
