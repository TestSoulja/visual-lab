import turtle
ninja = turtle.Turtle()
n = 1
l = 1
ninja.speed(10000000000)
ninja.forward(n/2)
ninja.right(90)

for i in range(1000):
    if i < 250:
        ninja.forward(n)
        ninja.right(n)
        n += 1
    else:
        ninja.forward(n)
        ninja.right(n)
        n -= 1


# for i in range(380):
#     ninja.forward(n)
#     ninja.right(90)
#     ninja.forward(n)
#     ninja.right(90)
#     ninja.forward(n)
#     ninja.right(90)
#     n += 2

    # ninja.penup()
    # ninja.setposition(0, 0)
    # ninja.pendown()

turtle.done()