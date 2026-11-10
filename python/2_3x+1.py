import os

# os.system("clear")

numper = int(input())
second = numper
count = int(1)
while second > 1:
    if numper % 2 == 0:
        numper /= 2
        second = numper
        count += 1
    else:
        numper = numper * 3 + 1
        second = numper
        count += 1
print(count)