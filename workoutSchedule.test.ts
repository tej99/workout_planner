import {gql} from 'apollo-server-express';
import {ApolloServer} from 'apollo-server-express';
import {resolvers, typeDefs, workoutSchedules} from './workoutSchedule';


const CREATE_WORKOUT_SCHEDULE = gql`
    mutation CreateWorkoutSchedule($workoutId: Int!, $scheduledDay: String!, $scheduledTime: TimeOfDay!) {
        createWorkoutSchedule(workoutId: $workoutId, scheduledDay: $scheduledDay, scheduledTime: $scheduledTime) {
            id
            workout {
                id
                name
            }
            scheduledDay
            scheduledTime
        }
    }
`;

const UPDATE_WORKOUT_SCHEDULE = gql`
    mutation UpdateWorkoutSchedule($id: String!, $workoutId: Int, $scheduledTime: TimeOfDay) {
        updateWorkoutSchedule(id: $id, workoutId: $workoutId, scheduledTime: $scheduledTime) {
            id
            workout {
                id
                name
            }
            scheduledDay
            scheduledTime
        }
    }
`;

const DELETE_WORKOUT_SCHEDULE = gql`
    mutation DeleteWorkoutSchedule($id: String!) {
        deleteWorkoutSchedule(id: $id)
    }
`;

const GET_WORKOUT_SCHEDULES = gql`
    query GetWorkoutSchedules($start: String!, $end: String!) {
        getWorkoutSchedules(start: $start, end: $end) {
            id
            workout {
                id
                name
            }
            scheduledTime
            scheduledDay
        }
    }
`;


describe('WorkoutSchedule API', () => {
    let server: ApolloServer;

    beforeAll(async () => {
        server = new ApolloServer({typeDefs, resolvers});
        await server.start();
    });

    afterAll(async () => {
        await server.stop();
    });

    it('should return workout schedules', async () => {
        const {data, errors} = await server.executeOperation({
            query: GET_WORKOUT_SCHEDULES,
            variables: {
                start: '2023-12-30',
                end: '2024-01-05',
            }
        });

        expect(errors).toBeUndefined();
        expect(data).toEqual({
            getWorkoutSchedules: [
                {
                    id: "2c7f5f3b-02ff-4983-b7a5-cf27f9dd65b4",
                    workout: {id: 1, name: "workout 1"},
                    scheduledTime: "AFTERNOON",
                    scheduledDay: "1704067200000"
                }
            ],
        });
    });

    it('should create a workout schedule', async () => {
        // Assuming you have a Workout already created with an ID
        const workoutId = 1;
        const res = await server.executeOperation({
            query: CREATE_WORKOUT_SCHEDULE,
            variables: {
                workoutId,
                scheduledDay: '2024-03-18',
                scheduledTime: 'MORNING'
            }
        });
        expect(res.data?.createWorkoutSchedule).toBeDefined();
        //assert record in db
    });

    it('should NOT create a workout schedule for same day', async () => {
        // Assuming you have a Workout already created with an ID
        const workoutId = 1;
        const res = await server.executeOperation({
            query: CREATE_WORKOUT_SCHEDULE,
            variables: {
                workoutId,
                scheduledDay: workoutSchedules[0].scheduledDay.toISOString().split('T')[0], // TODO use better date util
                scheduledTime: 'MORNING'
            }
        });

        expect(res.errors).toBeDefined();
        const errorMessages = res.errors?.map((error: any) => error.message);
        expect(errorMessages).toContain("Workout schedule already exists for this day");
    });

    it('should update a workout schedule', async () => {
        const res = await server.executeOperation({
            query: UPDATE_WORKOUT_SCHEDULE,
            variables: {
                id: workoutSchedules[0].id,
                workoutId: 2,
                scheduledTime: 'MORNING'
            }
        });
        expect(res.data?.updateWorkoutSchedule).toBeDefined();
        expect(res.data?.updateWorkoutSchedule.scheduledTime).toEqual('MORNING');
        //assert record in db
    });

    it('should delete a workout schedule', async () => {
        const res = await server.executeOperation({
            query: DELETE_WORKOUT_SCHEDULE,
            variables: {
                id: workoutSchedules[0].id
            }
        });
        expect(res.data?.deleteWorkoutSchedule).toBeDefined();
        //assert record not in db
    });
});
