import random
import time

bal = 10000
nums = ['0', '1', '2', '3', '4', '5']
while True:
    print('Ваш баланс ' + str(bal) + '$')
    print('Запустить автомат? (y или n), (-1000$)')
    if input() == "y":
        a = 1
        while a > 0:
            bal -= 1000
            print("Выбираем первое число...")
            time.sleep(0)
            print("Выбираем второе число...")
            time.sleep(0)
            print("Выбираем третье число...")
            time.sleep(0)
            choice = random.choices(nums, k=3)
            if choice == ['1', '1', '1']:
                print(choice)
                print('+500$')
                bal += 500
                print(bal)
                a -= 1
            elif choice == ['2', '2', '2']:
                print(choice)
                print('+1500$')
                bal += 1500
                print(bal)
                a -= 1
            elif choice == ['3', '3', '3']:
                print(choice)
                print('+2000$')
                bal += 2000
                print(bal)
                a -= 1
            elif choice == ['4', '4', '4']:
                print(choice)
                print('+3000$')
                bal += 3000
                print(bal)
                a -= 1
            elif choice == ['5', '5', '5']:
                print(choice)
                print('+5000$')
                bal += 5000
                print(bal)
                a -= 1
            elif choice == ['0', '0', '0']:
                print(choice)
                print('+6000$')
                bal += 6000
                print(bal)
                a -= 1
            else:
                print(choice)
                print('+0$')
                print(bal)
                a -= 1
    else:
        print("Пока")