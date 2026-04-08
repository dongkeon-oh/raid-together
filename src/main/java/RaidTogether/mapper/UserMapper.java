package RaidTogether.mapper;

import RaidTogether.domain.UserDomain;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper {
    UserDomain selectUserById(int id);
}
