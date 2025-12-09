package com.yutgame.console;

import java.util.Scanner;

/**
 * 사용자 입력 처리
 */
public class InputHandler {
    private final Scanner scanner;
    
    public InputHandler() {
        this.scanner = new Scanner(System.in);
    }
    
    public String readPlayerName(int playerNumber) {
        System.out.print("플레이어" + playerNumber + " 이름: ");
        return scanner.nextLine().trim();
    }
    
    public void waitForEnter(String message) {
        System.out.println("\n" + message);
        scanner.nextLine();
    }
    
    public int readPieceNumber(int maxPieces) {
        while (true) {
            try {
                System.out.print("\n이동할 말 번호 (1-" + maxPieces + "): ");
                String input = scanner.nextLine().trim();
                int number = Integer.parseInt(input);
                
                if (number >= 1 && number <= maxPieces) {
                    return number;
                } else {
                    System.out.println("1부터 " + maxPieces + " 사이의 숫자를 입력하세요.");
                }
            } catch (NumberFormatException e) {
                System.out.println("숫자를 입력하세요.");
            }
        }
    }
    
    public boolean askPlayAgain() {
        while (true) {
            System.out.print("\n다시 플레이하시겠습니까? (y/n): ");
            String input = scanner.nextLine().trim().toLowerCase();
            
            if (input.equals("y") || input.equals("yes")) {
                return true;
            } else if (input.equals("n") || input.equals("no")) {
                return false;
            } else {
                System.out.println("y 또는 n을 입력하세요.");
            }
        }
    }
    
    public void close() {
        scanner.close();
    }
}
