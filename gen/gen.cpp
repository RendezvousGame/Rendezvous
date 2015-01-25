#include <iostream>
#include <queue>
#include <ctime>

const int di[] = { 1, -1, 0, 0 };
const int dj[] = { 0, 0, 1, -1 };

std::vector<int> p;
std::vector<int> d;
std::queue<int> q;
char* s;
int width, height;
int statesCount;

int encode_state(int ai, int aj, int bi, int bj)
{
	return ((ai * width + aj) * height + bi) * width + bj;
}
void decode_state(int state, int& ai, int& aj, int& bi, int& bj)
{
	bj = state % width;
	state /= width;
	bi = state % height;
	state /= height;
	aj = state % width;
	ai = state / width;
}
char& cell(int i, int j)
{
	return s[i * width + j];
}
void queue_state(int ai, int aj, int bi, int bj, int dist, int prev)
{
	if(ai < 0 || ai >= height || aj < 0 || aj >= width || bi < 0 || bi >= height || bj < 0 || bj >= width)
		return;
	if(cell(ai, aj) != '.' || cell(bi, bj) != '.')
		return;
	int state = encode_state(ai, aj, bi, bj);
	if(d[state] >= 0)
		return;
	d[state] = dist;
	p[state] = prev;
	q.push(state);
};

void find_minimal_path()
{
	statesCount = width * height * width * height;

	p.assign(statesCount, -1);
	d.assign(statesCount, -1);

	for(int i = 0; i < height; ++i)
		for(int j = 0; j < width; ++j)
		{
			queue_state(i, j, i, j, 0, -1);
			for(int k = 0; k < 4; ++k)
				queue_state(i, j, i + di[k], j + dj[k], 1, -1);
		}
	while(!q.empty())
	{
		int state = q.front();
		q.pop();

		int ai, aj, bi, bj;
		decode_state(state, ai, aj, bi, bj);
		int dist = d[state];

		for(int k = 0; k < 4; ++k)
		{
			queue_state(ai - di[k], aj - dj[k], bi + di[k], bj + dj[k], dist + 1, state);
			if(cell(ai + di[k], aj + dj[k]) == 'x')
				queue_state(ai, aj, bi + di[k], bj + dj[k], dist + 1, state);
			if(cell(bi - di[k], bj - dj[k]) == 'x')
				queue_state(ai - di[k], aj - dj[k], bi, bj, dist + 1, state);
		}
	}
}

void generate()
{
	for(int i = 0; i < height; ++i)
		for(int j = 0; j < width; ++j)
			s[i * width + j] = 'x';

	for(int i = 1; i < height - 1; ++i)
		for(int j = 1; j < width - 1; ++j)
		{
			float r = (float)rand() / RAND_MAX;
			char c;
			if(r < 0.2f)
				c = 'x';
			else if(r < 0.25f)
				c = 'f';
			else
				c = '.';
			s[i * width + j] = c;
		}
}

void print(int& rai, int& raj, int& rbi, int& rbj)
{
	for(int i = 0; i < height; ++i)
	{
		for(int j = 0; j < width; ++j)
		{
			char c = s[i * width + j];
			if(i == rai && j == raj)
				c = 'A';
			else if(i == rbi && j == rbj)
				c = 'B';
			printf("%c", c);
		}
		printf("\n");
	}
}

void printPath(int state)
{
	while(state >= 0)
	{
		int ai1, aj1, bi1, bj1;
		decode_state(state, ai1, aj1, bi1, bj1);
		int nextState = p[state];
		if(nextState < 0)
			break;
		int ai2, aj2, bi2, bj2;
		decode_state(nextState, ai2, aj2, bi2, bj2);

		int di = (ai2 - ai1) | (bi1 - bi2);
		int dj = (aj2 - aj1) | (bj1 - bj2);

		char* c;
		if(di == 1 && dj == 0)
			c = "DOWN";
		else if(di == -1 && dj == 0)
			c = "UP";
		else if(di == 0 && dj == 1)
			c = "RIGHT";
		else if(di == 0 && dj == -1)
			c = "LEFT";
		else
			throw 0;

		printf("%s\n", c);

		state = nextState;
	}
}

int main()
{
	freopen("output.txt", "w", stdout);

	static char storage[10000000];
	s = storage;

// find a way to some map
#if 0

#if 1
	// level 11
	width = 11;
	height = 5;
	strcpy(s, "xxxxxxxxxxxx...f..f..xx..x.f....xx......fx.xxxxxxxxxxxx");
#endif
#if 0
	// level 13
	width = 10;
	height = 5;
	strcpy(s, "xxxxxxxxxxxx.x.fx..xx..x...f.xx.x.x....xxxxxxxxxxx");
#endif
#if 0
	// level 8
	width = 10;
	height = 5;
	strcpy(s, "xxxxxxxxxxx.......xxx...xx..fxx..f.....xxxxxxxxxxx");
#endif

	find_minimal_path();
	{
		int maxDist = -1, maxDistState = -1;
		for(int k = 0; k < statesCount; ++k)
			if(d[k] >= 0)
				if(maxDist < d[k])
				{
					maxDist = d[k];
					maxDistState = k;
				}

		if(maxDist >= 0)
		{
			int rai, raj, rbi, rbj;
			decode_state(maxDistState, rai, raj, rbi, rbj);
			printf("%d\n", maxDist);
			print(rai, raj, rbi, rbj);
			printPath(maxDistState);
		}
	}

#else
	// generate new levels

	srand((unsigned int)time(0));

	width = 11;
	height = 5;
	for(int k = 0; k < 1000000; ++k)
	{
		generate();

		find_minimal_path();
		int maxDist = -1, maxDistState = -1;
		for(int k = 0; k < statesCount; ++k)
			if(d[k] >= 0)
				if(maxDist < d[k])
				{
					maxDist = d[k];
					maxDistState = k;
				}

		if(maxDist >= 0)
		{
			int rai, raj, rbi, rbj;
			decode_state(maxDistState, rai, raj, rbi, rbj);
			if(maxDist >= 20)
			{
				printf("%d\n", maxDist);
				print(rai, raj, rbi, rbj);
				printPath(maxDistState);
			}
		}
	}

#endif

	return 0;
}
