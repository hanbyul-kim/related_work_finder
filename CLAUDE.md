# Paper Citation Counter - Obsidian Plugin

## 프로젝트 개요
Related work에 공통적으로 많이 언급된 논문을 찾는 Obsidian 플러그인

## 핵심 기능
- Papers 폴더 내 마크다운 파일들에서 Related work 섹션 스캔
- 논문 인용 횟수 카운팅 및 랭킹
- 결과를 새로운 노트로 생성

## 입력 형식 (사용자의 현재 형태)
```markdown
## Related work

### General iterative alignment methods

- Bai et al., 2022, Training a helpful and harmless assistant with reinforcement learning from human feedback
- Touvron et al., 2023, Llama 2: Open foundation and fine-tuned chat models
- Xu et al., 2023, Some things are more cringe than others: Preference optimization with the pairwise cringe loss
```

## 파싱 로직
1. `## Related work` 섹션 찾기: `/## Related work([\s\S]*?)(?=##|$)/`
2. 인용 패턴 추출: `/- (.+?), (\d{4}), (.+)/g`
3. 저자명+연도로 논문 식별 (중복 제거)

## 플러그인 구조

### 주요 컴포넌트
- **Command**: "Count Paper Citations in Papers Folder"
- **PaperCitation Interface**: 논문 정보와 카운트 저장
- **parseRelatedWork()**: 개별 파일의 Related work 섹션 파싱
- **generateReport()**: 결과 리포트 생성

### 출력 예시
```markdown
# Paper Citation Analysis
Generated: 2024-12-07
Source: Papers folder

## Most Cited Papers

1. **Bai et al., 2022** (3회)
   - *Training a helpful and harmless assistant with reinforcement learning from human feedback*
   - Sources: paper1.md, paper2.md, paper3.md

## Statistics
- Total unique citations: 45
- Total citation instances: 78
- Most cited: 3 times
- Papers with multiple citations: 12
```

## 구현 계획
1. ✅ 요구사항 분석 완료
2. ✅ 시스템 아키텍처 설계 완료  
3. ✅ 사용자 입력 형식 분석 완료
4. ✅ 파싱 로직 설계 완료
5. 🔄 Obsidian 플러그인 구현
6. ⏳ 인용 파싱 및 카운팅 로직 구현
7. ⏳ 결과 표시 기능 구현

## 다음 단계
1. Obsidian 플러그인 템플릿 클론
2. main.ts 및 manifest.json 파일 생성
3. 테스트 및 디버깅