@echo off
echo ===================================
echo 윷놀이 게임 빌드 및 실행
echo ===================================
echo.

REM 빌드 디렉토리 생성
if not exist bin mkdir bin

echo [1/3] 컴파일 중...
javac -d bin -sourcepath src -encoding UTF-8 src\com\yutgame\Main.java src\com\yutgame\domain\*.java src\com\yutgame\console\*.java

if %errorlevel% neq 0 (
    echo 컴파일 실패!
    pause
    exit /b 1
)

echo [2/3] 컴파일 완료!
echo.
echo [3/3] 게임 실행 중...
echo.

java -cp bin com.yutgame.Main

echo.
echo 게임이 종료되었습니다.
pause
