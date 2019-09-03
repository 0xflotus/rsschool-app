import * as React from 'react';
import { Table, Typography, Button } from 'antd';
import { Header, withSession, LoadingScreen, GithubAvatar } from 'components';
import withCourseData from 'components/withCourseData';
import { getColumnSearchProps, stringSorter, numberSorter } from 'components/Table';
import { CourseTask, CourseService, StudentScore } from 'services/course';
import { sortTasksByEndDate } from 'services/rules';
import { CoursePageProps } from 'services/models';
import css from 'styled-jsx/css';

const { Text } = Typography;

type State = {
  students: StudentScore[];
  isLoading: boolean;
  courseTasks: CourseTask[];
};

class ScorePage extends React.Component<CoursePageProps, State> {
  state: State = {
    isLoading: false,
    students: [],
    courseTasks: [],
  };

  private courseService = new CourseService();

  async componentDidMount() {
    this.setState({ isLoading: true });

    const courseId = this.props.course.id;
    const [courseScore, courseTasks] = await Promise.all([
      this.courseService.getCourseScore(courseId),
      this.courseService.getCourseTasks(courseId),
    ]);

    const sortedTasks = courseTasks
      .filter(task => !!task.studentEndDate || this.props.course.completed)
      .sort(sortTasksByEndDate);

    this.setState({ students: courseScore, courseTasks: sortedTasks, isLoading: false });
  }

  render() {
    const { isAdmin, isHirer } = this.props.session;
    const csvEnabled = isAdmin || isHirer;
    return (
      <>
        <Header title="Score" username={this.props.session.githubId} courseName={this.props.course.name} />
        <LoadingScreen show={this.state.isLoading}>
          <div className="d-flex justify-content-between align-items-center m-2">
            <Text mark>Score is refreshed every 5 minutes</Text>

            {csvEnabled && (
              <Button
                icon="file-excel"
                onClick={() => (window.location.href = `/api/course/${this.props.course.id}/score/csv`)}
              >
                Export CSV
              </Button>
            )}
          </div>
          <Table<StudentScore>
            className="m-3"
            bordered
            scroll={{ x: 2000 }}
            style={{ overflowY: 'scroll' }}
            pagination={{ pageSize: 100 }}
            size="small"
            rowKey="githubId"
            rowClassName={record => (!record.isActive ? 'rs-table-row-disabled' : '')}
            dataSource={this.state.students}
            columns={[
              {
                title: '#',
                dataIndex: 'rank',
                key: 'rank',
                width: 50,
              },
              {
                title: 'Github',
                dataIndex: 'githubId',
                key: 'githubId',
                sorter: stringSorter('githubId'),
                width: 100,
                render: (value: string) => (
                  <div className="d-flex flex-row">
                    <GithubAvatar githubId={value} size={24} />
                    &nbsp;<a href={`/profile?githubId=${value}`}>{value}</a>
                  </div>
                ),
                ...getColumnSearchProps('githubId'),
              },
              {
                title: 'Name',
                dataIndex: 'lastName',
                key: 'lastName',
                width: 150,
                sorter: stringSorter('firstName'),
                render: (_: any, record: StudentScore) => `${record.firstName} ${record.lastName}`,
                ...getColumnSearchProps('lastName'),
              },
              {
                title: 'Mentor',
                dataIndex: 'mentor.githubId',
                key: 'mentor.githubId',
                width: 100,
                render: (value: string) => <a href={`/profile?githubId=${value}`}>{value}</a>,
                ...getColumnSearchProps('mentor.githubId'),
              },
              {
                title: 'Location',
                dataIndex: 'locationName',
                key: 'locationName',
                width: 100,
                sorter: stringSorter('locationName'),
              },
              {
                title: 'Total',
                dataIndex: 'totalScore',
                key: 'totalScore',
                width: 100,
                sorter: numberSorter('totalScore'),
                render: value => <Text strong>{value}</Text>,
              },
              ...this.getColumns(),
            ]}
          />
        </LoadingScreen>
        <style jsx>{styles}</style>
      </>
    );
  }

  private getColumns() {
    const columns = this.state.courseTasks.map(task => ({
      dataIndex: task.id.toString(),
      key: task.id.toString(),
      title: () => {
        return task.descriptionUrl ? (
          <a className="table-header-link" href={task.descriptionUrl}>
            {task.name}
          </a>
        ) : (
          <div>{task.name}</div>
        );
      },
      width: 75,
      className: 'align-right',
      render: (_: any, d: StudentScore) => {
        const currentTask = d.taskResults.find((taskResult: any) => taskResult.courseTaskId === task.courseTaskId);
        return currentTask ? <div>{currentTask.score}</div> : 0;
      },
    }));
    return columns;
  }
}

const styles = css`
  :global(.rs-table-row-disabled) {
    opacity: 0.25;
  }
`;

export default withCourseData(withSession(ScorePage));
